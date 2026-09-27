import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "../ui/use-toast";
import { setProductDetails } from "@/store/shop/products-slice";
import { Label } from "../ui/label";
import StarRatingComponent from "../common/star-rating";
import { useEffect, useState } from "react";
import { addReview, getReviews } from "@/store/shop/review-slice";
import { fetchRecommendations, clearRecommendations } from "@/store/shop/recommendation-slice";
import axios from "axios";

// Sentiment analysis helper — calls our backend
async function getSentiment(reviewMessage) {
  try {
    const res = await axios.post("/api/shop/sentiment/analyze", {
      reviewMessage,
    });
    return res.data.sentiment;
  } catch {
    return "neutral";
  }
}

function SentimentBadge({ sentiment }) {
  if (sentiment === "positive")
    return <Badge className="bg-green-500 text-white text-xs">😊 Positive</Badge>;
  if (sentiment === "negative")
    return <Badge className="bg-red-500 text-white text-xs">😞 Negative</Badge>;
  return <Badge className="bg-yellow-400 text-white text-xs">😐 Neutral</Badge>;
}

function ProductDetailsDialog({ open, setOpen, productDetails }) {
  const [reviewMsg, setReviewMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [sentimentMap, setSentimentMap] = useState({});
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { reviews } = useSelector((state) => state.shopReview);
  const { recommendations } = useSelector((state) => state.shopRecommendations);
  const { toast } = useToast();

  function handleRatingChange(getRating) {
    setRating(getRating);
  }

  function handleAddToCart(getCurrentProductId, getTotalStock) {
    let getCartItems = cartItems.items || [];
    if (getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(
        (item) => item.productId === getCurrentProductId
      );
      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added for this item`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    dispatch(addToCart({ userId: user?.id, productId: getCurrentProductId, quantity: 1 }))
      .then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchCartItems(user?.id));
          toast({ title: "Product is added to cart" });
        }
      });
  }

  function handleDialogClose() {
    setOpen(false);
    dispatch(setProductDetails());
    dispatch(clearRecommendations());
    setRating(0);
    setReviewMsg("");
    setSentimentMap({});
  }

  function handleAddReview() {
    dispatch(
      addReview({
        productId: productDetails?._id,
        userId: user?.id,
        userName: user?.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      })
    ).then((data) => {
      if (data.payload.success) {
        setRating(0);
        setReviewMsg("");
        dispatch(getReviews(productDetails?._id));
        toast({ title: "Review added successfully!" });
      }
    });
  }

  // Fetch reviews and recommendations when product opens
  useEffect(() => {
    if (productDetails !== null) {
      dispatch(getReviews(productDetails?._id));
      dispatch(fetchRecommendations(productDetails?._id));
    }
  }, [dispatch, productDetails]);

  // Analyze sentiment for each review
  useEffect(() => {
    if (reviews && reviews.length > 0) {
      reviews.forEach(async (review) => {
        if (!sentimentMap[review._id]) {
          const sentiment = await getSentiment(review.reviewMessage);
          setSentimentMap((prev) => ({ ...prev, [review._id]: sentiment }));
        }
      });
    }
  }, [reviews]); // eslint-disable-line react-hooks/exhaustive-deps

  const averageReview =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) / reviews.length
      : 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="grid grid-cols-2 gap-8 sm:p-12 max-w-[90vw] sm:max-w-[80vw] lg:max-w-[70vw] overflow-auto max-h-[90vh]">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={productDetails?.image}
            alt={productDetails?.title}
            width={600}
            height={600}
            className="aspect-square w-full object-cover"
          />
        </div>
        <div>
          <div>
            <h1 className="text-3xl font-extrabold">{productDetails?.title}</h1>
            <p className="text-muted-foreground text-2xl mb-5 mt-4">
              {productDetails?.description}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className={`text-3xl font-bold text-primary ${productDetails?.salePrice > 0 ? "line-through" : ""}`}>
              ₹{productDetails?.price}
            </p>
            {productDetails?.salePrice > 0 ? (
              <p className="text-2xl font-bold text-muted-foreground">
                ₹{productDetails?.salePrice}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              <StarRatingComponent rating={averageReview} />
            </div>
            <span className="text-muted-foreground">({averageReview.toFixed(2)})</span>
          </div>
          <div className="mt-5 mb-5">
            {productDetails?.totalStock === 0 ? (
              <Button className="w-full opacity-60 cursor-not-allowed">Out of Stock</Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleAddToCart(productDetails?._id, productDetails?.totalStock)}
              >
                Add to Cart
              </Button>
            )}
          </div>
          <Separator />

          {/* Reviews with Sentiment Badges */}
          <div className="max-h-[300px] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Reviews</h2>
            <div className="grid gap-6">
              {reviews && reviews.length > 0 ? (
                reviews.map((reviewItem) => (
                  <div key={reviewItem._id} className="flex gap-4">
                    <Avatar className="w-10 h-10 border">
                      <AvatarFallback>
                        {reviewItem?.userName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{reviewItem?.userName}</h3>
                        {/* AI Sentiment Badge */}
                        <SentimentBadge sentiment={sentimentMap[reviewItem._id] || "neutral"} />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <StarRatingComponent rating={reviewItem?.reviewValue} />
                      </div>
                      <p className="text-muted-foreground">{reviewItem.reviewMessage}</p>
                    </div>
                  </div>
                ))
              ) : (
                <h1>No Reviews</h1>
              )}
            </div>
            <div className="mt-10 flex-col flex gap-2">
              <Label>Write a review</Label>
              <div className="flex gap-1">
                <StarRatingComponent rating={rating} handleRatingChange={handleRatingChange} />
              </div>
              <Input
                name="reviewMsg"
                value={reviewMsg}
                onChange={(event) => setReviewMsg(event.target.value)}
                placeholder="Write a review..."
              />
              <Button onClick={handleAddReview} disabled={reviewMsg.trim() === ""}>
                Submit
              </Button>
            </div>
          </div>

          {/* AI Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <>
              <Separator className="mt-6" />
              <div className="mt-4">
                <h2 className="text-xl font-bold mb-3">🤖 You May Also Like</h2>
                <div className="grid grid-cols-2 gap-3">
                  {recommendations.map((item) => (
                    <div
                      key={item._id}
                      className="flex gap-2 items-center border rounded-lg p-2 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <img src={item.image} className="w-14 h-14 object-cover rounded" />
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-primary font-bold text-sm">
                          {item.salePrice > 0 ? `₹${item.salePrice}` : `₹${item.price}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDetailsDialog;
