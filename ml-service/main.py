from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from prophet import Prophet
import warnings
warnings.filterwarnings("ignore")

app = FastAPI(title="ML Service")

# CORS — read allowed origins from environment variable (comma-separated)
_default_origins = ["http://localhost:5000", "http://localhost:5173"]
_env_origins = os.environ.get("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip().rstrip("/") for o in _env_origins.split(",") if o.strip()]
allow_origins = list(set(_default_origins + _extra_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ───────────────────────────────────────────────────────────────────

class ReviewInput(BaseModel):
    text: str

class ReviewsBatch(BaseModel):
    reviews: List[str]

class Product(BaseModel):
    productId: str
    title: str
    description: Optional[str] = ""
    category: Optional[str] = ""

class RecommendInput(BaseModel):
    targetProductId: str
    products: List[Product]
    orderHistory: Optional[List[List[str]]] = []

class SearchInput(BaseModel):
    query: str
    products: List[Product]

class OrderItem(BaseModel):
    orderId: str
    userId: str
    totalAmount: float
    itemCount: int
    address: Optional[str] = ""

class FraudInput(BaseModel):
    orders: List[OrderItem]

class PricingInput(BaseModel):
    price: float
    totalStock: int
    soldLast7Days: int
    averageRating: Optional[float] = 4.0

class DemandInput(BaseModel):
    productId: str
    salesHistory: List[dict]  # [{date: "2024-01-01", quantity: 5}]

# ─── 1. Sentiment Analysis ────────────────────────────────────────────────────

analyzer = SentimentIntensityAnalyzer()

@app.post("/sentiment")
def analyze_sentiment(data: ReviewInput):
    scores = analyzer.polarity_scores(data.text)
    compound = scores["compound"]
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    return {"label": label, "score": round(compound, 4), "details": scores}

@app.post("/sentiment/batch")
def analyze_sentiment_batch(data: ReviewsBatch):
    results = []
    for text in data.reviews:
        scores = analyzer.polarity_scores(text)
        compound = scores["compound"]
        label = "positive" if compound >= 0.05 else "negative" if compound <= -0.05 else "neutral"
        results.append({"text": text, "label": label, "score": round(compound, 4)})
    return {"results": results}

# ─── 2. Product Recommendations ───────────────────────────────────────────────

@app.post("/recommendations")
def get_recommendations(data: RecommendInput):
    products = data.products
    if len(products) < 2:
        return {"recommendations": []}

    # Collaborative filtering from order history
    collab_scores = {}
    if data.orderHistory:
        for order in data.orderHistory:
            if data.targetProductId in order:
                for pid in order:
                    if pid != data.targetProductId:
                        collab_scores[pid] = collab_scores.get(pid, 0) + 1

    # Content-based: TF-IDF on title + description + category
    corpus = [f"{p.title} {p.description} {p.category}" for p in products]
    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(corpus)

    target_idx = next((i for i, p in enumerate(products) if p.productId == data.targetProductId), None)
    if target_idx is None:
        return {"recommendations": []}

    content_scores = cosine_similarity(tfidf_matrix[target_idx], tfidf_matrix).flatten()

    # Combine scores
    final_scores = {}
    for i, p in enumerate(products):
        if p.productId == data.targetProductId:
            continue
        score = content_scores[i] + collab_scores.get(p.productId, 0) * 0.3
        final_scores[p.productId] = score

    top = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)[:4]
    recommended_ids = [pid for pid, _ in top]

    result = [p.dict() for p in products if p.productId in recommended_ids]
    return {"recommendations": result}

# ─── 3. Search Ranking ────────────────────────────────────────────────────────

@app.post("/search/rank")
def rank_search(data: SearchInput):
    if not data.products:
        return {"results": []}

    corpus = [f"{p.title} {p.description} {p.category}" for p in data.products]
    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(corpus)
    query_vec = tfidf.transform([data.query])
    scores = cosine_similarity(query_vec, tfidf_matrix).flatten()

    ranked = sorted(
        [{"product": p.dict(), "score": round(float(scores[i]), 4)} for i, p in enumerate(data.products)],
        key=lambda x: x["score"],
        reverse=True
    )
    return {"results": [r["product"] for r in ranked if r["score"] > 0]}

# ─── 4. Fraud Detection ───────────────────────────────────────────────────────

@app.post("/fraud/detect")
def detect_fraud(data: FraudInput):
    if len(data.orders) < 5:
        return {"flagged": [], "message": "Not enough data for ML fraud detection"}

    df = pd.DataFrame([o.dict() for o in data.orders])
    features = df[["totalAmount", "itemCount"]].values

    model = IsolationForest(contamination=0.1, random_state=42)
    preds = model.fit_predict(features)

    flagged = []
    for i, pred in enumerate(preds):
        if pred == -1:
            flagged.append({
                "orderId": data.orders[i].orderId,
                "userId": data.orders[i].userId,
                "totalAmount": data.orders[i].totalAmount,
                "reason": "Anomalous order pattern detected by ML"
            })

    return {"flagged": flagged}

# ─── 5. Dynamic Pricing ───────────────────────────────────────────────────────

@app.post("/pricing/suggest")
def suggest_price(data: PricingInput):
    # Features: stock level, demand (soldLast7Days), rating
    demand_score = data.soldLast7Days / max(data.totalStock, 1)
    
    # High demand + low stock → increase price
    # Low demand + high stock → suggest discount
    if demand_score > 0.5:
        suggested = round(data.price * 1.10, 2)  # 10% increase
        reason = "High demand, low stock"
    elif demand_score < 0.1 and data.totalStock > 50:
        suggested = round(data.price * 0.85, 2)  # 15% discount
        reason = "Low demand, high stock — suggest discount"
    else:
        suggested = data.price
        reason = "Price is optimal"

    # Rating boost
    if data.averageRating >= 4.5:
        suggested = round(suggested * 1.05, 2)
        reason += " + premium rating"

    return {
        "currentPrice": data.price,
        "suggestedPrice": suggested,
        "demandScore": round(demand_score, 4),
        "reason": reason
    }

# ─── 6. Demand Forecasting ────────────────────────────────────────────────────

@app.post("/demand/forecast")
def forecast_demand(data: DemandInput):
    if len(data.salesHistory) < 2:
        return {"forecast": [], "message": "Not enough data to forecast"}

    df = pd.DataFrame(data.salesHistory)
    df.columns = ["ds", "y"]
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)

    model = Prophet(daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
    model.fit(df)

    future = model.make_future_dataframe(periods=7)
    forecast = model.predict(future)

    next7 = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(7)
    result = []
    for _, row in next7.iterrows():
        result.append({
            "date": row["ds"].strftime("%Y-%m-%d"),
            "predicted": max(0, round(row["yhat"], 1)),
            "lower": max(0, round(row["yhat_lower"], 1)),
            "upper": max(0, round(row["yhat_upper"], 1))
        })

    return {"productId": data.productId, "forecast": result}

# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "ML Service"}

# ─── Entrypoint ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
