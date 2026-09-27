import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSalesAnalytics,
  fetchTopProducts,
  fetchLowStockAlerts,
  fetchFraudAlerts,
} from "@/store/shop/analytics-slice";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

function AnalyticsDashboard() {
  const dispatch = useDispatch();
  const { salesData, topProducts, lowStockAlerts, fraudAlerts } = useSelector(
    (state) => state.shopAnalytics
  );

  useEffect(() => {
    dispatch(fetchSalesAnalytics());
    dispatch(fetchTopProducts());
    dispatch(fetchLowStockAlerts());
    dispatch(fetchFraudAlerts());
  }, [dispatch]);

  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="grid gap-6 mt-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">7-Day Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">7-Day Orders</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalOrders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm text-muted-foreground">Fraud Alerts</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-500">{fraudAlerts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart (bar using divs) */}
      <Card>
        <CardHeader><CardTitle>📈 Sales Last 7 Days</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {salesData.map((day) => {
              const maxRevenue = Math.max(...salesData.map((d) => d.revenue), 1);
              const heightPercent = (day.revenue / maxRevenue) * 100;
              return (
                <div key={day.date} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-xs text-muted-foreground">${day.revenue.toFixed(0)}</span>
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {day.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader><CardTitle>🏆 Top Selling Products</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {topProducts.map((product, index) => (
              <div key={product.productId} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground">#{index + 1}</span>
                  {product.image && (
                    <img src={product.image} className="w-10 h-10 rounded object-cover" />
                  )}
                  <span className="font-medium">{product.title}</span>
                </div>
                <div className="flex gap-3 text-sm text-muted-foreground">
                  <span>{product.totalSold} sold</span>
                  <span className="font-bold text-primary">${product.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-muted-foreground">No sales data yet</p>}
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card>
        <CardHeader><CardTitle>⚠️ Low Stock Alerts (AI Prediction)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {lowStockAlerts.map((item) => (
              <div key={item.productId} className="flex items-center justify-between border-b pb-2">
                <span className="font-medium">{item.title}</span>
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Stock: {item.totalStock}</span>
                  <Badge className={item.daysUntilEmpty <= 7 ? "bg-red-500" : "bg-yellow-500"}>
                    {item.daysUntilEmpty <= 999 ? `~${item.daysUntilEmpty} days left` : "Low stock"}
                  </Badge>
                </div>
              </div>
            ))}
            {lowStockAlerts.length === 0 && <p className="text-muted-foreground">All products have sufficient stock</p>}
          </div>
        </CardContent>
      </Card>

      {/* Fraud Alerts */}
      <Card>
        <CardHeader><CardTitle>🚨 Fraud Detection Alerts</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {fraudAlerts.map((alert) => (
              <div key={alert.orderId} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Order: {alert.orderId}</span>
                  <span className="font-bold text-red-500">${alert.totalAmount}</span>
                </div>
                <div className="flex gap-2 flex-wrap mt-1">
                  {alert.reasons.map((reason, i) => (
                    <Badge key={i} className="bg-red-100 text-red-700">{reason}</Badge>
                  ))}
                </div>
              </div>
            ))}
            {fraudAlerts.length === 0 && <p className="text-muted-foreground">No suspicious orders detected</p>}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default AnalyticsDashboard;
