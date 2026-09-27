import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { fetchFraudAlerts, fetchPricingSuggestion, fetchDemandForecast } from "@/store/admin/ml-slice";
import { fetchAllProducts } from "@/store/admin/products-slice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function MLDashboard() {
  const dispatch = useDispatch();
  const { fraudData, pricingData, forecastData, isLoading } = useSelector((state) => state.adminMl);
  const { productList } = useSelector((state) => state.adminProducts);
  const [selectedProduct, setSelectedProduct] = useState("");

  useEffect(() => {
    dispatch(fetchFraudAlerts());
    dispatch(fetchAllProducts());
  }, [dispatch]);

  function handleProductSelect(productId) {
    setSelectedProduct(productId);
    dispatch(fetchPricingSuggestion(productId));
    dispatch(fetchDemandForecast(productId));
  }

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold">🤖 ML Intelligence Dashboard</h2>

      {/* Fraud Detection */}
      <Card>
        <CardHeader>
          <CardTitle>🚨 Fraud Detection</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Analyzing orders...</p>
          ) : fraudData?.flagged?.length > 0 ? (
            <div className="space-y-3">
              {fraudData.flagged.map((item, i) => (
                <div key={i} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">Order: {item.orderId}</p>
                    <p className="text-xs text-muted-foreground">User: {item.userId}</p>
                    <p className="text-xs text-red-500">{item.reason}</p>
                  </div>
                  <Badge className="bg-red-500 text-white">₹{item.totalAmount}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-600 font-medium">✅ No suspicious orders detected</p>
          )}
          {fraudData?.message && (
            <p className="text-muted-foreground text-sm mt-2">{fraudData.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Product Selector */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Select Product for ML Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleProductSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a product..." />
            </SelectTrigger>
            <SelectContent>
              {productList && productList.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dynamic Pricing */}
      {pricingData && (
        <Card>
          <CardHeader>
            <CardTitle>💰 Dynamic Pricing Suggestion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-bold text-lg">₹{pricingData.currentPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Suggested Price</span>
              <span className={`font-bold text-lg ${pricingData.suggestedPrice > pricingData.currentPrice ? "text-green-600" : "text-orange-500"}`}>
                ₹{pricingData.suggestedPrice}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Demand Score</span>
              <Badge variant="outline">{pricingData.demandScore}</Badge>
            </div>
            <p className="text-sm text-blue-600 bg-blue-50 rounded p-2">{pricingData.reason}</p>
          </CardContent>
        </Card>
      )}

      {/* Demand Forecasting */}
      {forecastData?.forecast?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📈 7-Day Demand Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {forecastData.forecast.map((day, i) => (
                <div key={i} className="flex flex-col items-center border rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground">{day.date.slice(5)}</p>
                  <p className="font-bold text-lg text-primary">{day.predicted}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
              ))}
            </div>
            {forecastData.message && (
              <p className="text-muted-foreground text-sm mt-2">{forecastData.message}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MLDashboard;
