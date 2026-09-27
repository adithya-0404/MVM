import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

function PaymentFailedPage() {
  const navigate = useNavigate();
  return (
    <Card className="p-10">
      <CardHeader className="p-0">
        <CardTitle className="text-4xl text-red-500">Payment Failed!</CardTitle>
      </CardHeader>
      <p className="mt-3 text-muted-foreground">Something went wrong with your payment. Please try again.</p>
      <Button className="mt-5" onClick={() => navigate("/shop/checkout")}>
        Try Again
      </Button>
    </Card>
  );
}

export default PaymentFailedPage;
