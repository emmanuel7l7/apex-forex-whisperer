import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Bell, TrendingUp, TrendingDown, Calculator, Target, AlertCircle, RefreshCw, BellRing } from "lucide-react";
import { useForexData } from "@/hooks/useForexData";
import { toast } from "@/components/ui/use-toast";

const getSignalColor = (signal: string) => {
  switch (signal) {
    case "BUY": return "text-trading-buy";
    case "SELL": return "text-trading-sell";
    default: return "text-trading-neutral";
  }
};

const getSignalBadgeVariant = (signal: string) => {
  switch (signal) {
    case "BUY": return "default";
    case "SELL": return "destructive";
    default: return "secondary";
  }
};

export default function TradingDashboard() {
  const [balance, setBalance] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("2");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { 
    currencyPairs, 
    notifications, 
    loading, 
    error, 
    updateForexData, 
    runAIAnalysis, 
    markNotificationAsRead,
    unreadCount 
  } = useForexData();

  // Focus on top 2 pairs with highest signal strength
  const topPairs = currencyPairs
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2);

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateForexData();
      await runAIAnalysis();
      toast({
        title: "Data Updated",
        description: "Successfully refreshed forex data and AI analysis",
      });
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Failed to update data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    // Show toast for new high-priority notifications
    const highPriorityNotifications = notifications.filter(
      n => !n.is_read && n.priority >= 4
    );
    
    if (highPriorityNotifications.length > 0) {
      const latest = highPriorityNotifications[0];
      toast({
        title: latest.title,
        description: latest.message,
      });
    }
  }, [notifications]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading forex data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleManualUpdate} disabled={isUpdating}>
              {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculatePosition = (pair: any) => {
    const balanceNum = parseFloat(balance) || 0;
    const riskPercentNum = parseFloat(riskPercent) || 0;
    const riskAmount = (balanceNum * riskPercentNum) / 100;
    
    // Simplified calculation - in real implementation would use proper forex calculations
    const lotSize = (riskAmount / 100).toFixed(2);
    const stopLoss = pair.signal === "BUY" ? (pair.price * 0.995).toFixed(4) : (pair.price * 1.005).toFixed(4);
    const takeProfit = pair.signal === "BUY" ? (pair.price * 1.015).toFixed(4) : (pair.price * 0.985).toFixed(4);
    
    return { lotSize, stopLoss, takeProfit, riskAmount: riskAmount.toFixed(2) };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Forex Trading Bot</h1>
            <p className="text-muted-foreground">Advanced forex analysis and signal generation</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualUpdate}
              disabled={isUpdating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              Update Data
            </Button>
            <Button variant="outline" size="sm" className="relative">
              {unreadCount > 0 ? (
                <BellRing className="w-4 h-4 mr-2 text-trading-gold animate-pulse" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Notifications
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 px-1 py-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Top Focus Pairs */}
        <div className="grid gap-4 md:grid-cols-2">
          {topPairs.map((pair) => (
            <Card key={pair.symbol} className={`border-2 ${pair.symbol === 'XAUUSD' ? 'border-trading-gold' : 'border-border'}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{pair.symbol}</CardTitle>
                <Badge variant={getSignalBadgeVariant(pair.signal)} className="font-semibold">
                  {pair.signal}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold">{Number(pair.price).toFixed(pair.symbol === 'USDJPY' ? 2 : 4)}</div>
                    <div className={`flex items-center ${pair.change_value >= 0 ? 'text-trading-buy' : 'text-trading-sell'}`}>
                      {pair.change_value >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {pair.change_value > 0 ? '+' : ''}{Number(pair.change_value).toFixed(4)} ({Number(pair.change_percent).toFixed(2)}%)
                    </div>
                    {pair.pattern && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Pattern: {pair.pattern}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Signal Strength</div>
                    <div className="flex items-center space-x-2">
                      <Progress value={pair.strength} className="w-20" />
                      <span className="text-sm font-medium">{pair.strength}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">{pair.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Market Analysis</TabsTrigger>
            <TabsTrigger value="calculator">Risk Calculator</TabsTrigger>
            <TabsTrigger value="signals">All Signals</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currencyPairs.filter(p => p.signal !== "NEUTRAL").length}</div>
                  <p className="text-xs text-muted-foreground">
                    {currencyPairs.filter(p => p.signal === "BUY").length} Buy, {currencyPairs.filter(p => p.signal === "SELL").length} Sell signals
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Signal Strength</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currencyPairs.length > 0 ? Math.round(currencyPairs.reduce((acc, p) => acc + p.strength, 0) / currencyPairs.length) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Market confidence level
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">XAUUSD Focus</CardTitle>
                  <span className="text-trading-gold">★</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-trading-gold">
                    {currencyPairs.find(p => p.symbol === "XAUUSD")?.strength || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Gold signal strength
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Position Size Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="balance">Account Balance (USD)</Label>
                    <Input
                      id="balance"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="risk">Risk per Trade (%)</Label>
                    <Input
                      id="risk"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(e.target.value)}
                      placeholder="2"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {topPairs.map((pair) => {
                    const calc = calculatePosition(pair);
                    return (
                      <Card key={pair.symbol} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{pair.symbol}</span>
                          <Badge variant={getSignalBadgeVariant(pair.signal)}>{pair.signal}</Badge>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>Recommended Lot Size:</span>
                            <span className="font-medium">{calc.lotSize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stop Loss:</span>
                            <span className="font-medium">{calc.stopLoss}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Take Profit:</span>
                            <span className="font-medium">{calc.takeProfit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Risk Amount:</span>
                            <span className="font-medium">${calc.riskAmount}</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currencyPairs.map((pair) => (
                <Card key={pair.symbol}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{pair.symbol}</CardTitle>
                    <Badge variant={getSignalBadgeVariant(pair.signal)}>{pair.signal}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{Number(pair.price).toFixed(pair.symbol === 'USDJPY' ? 2 : 4)}</span>
                        <span className={`text-sm ${pair.change_value >= 0 ? 'text-trading-buy' : 'text-trading-sell'}`}>
                          {pair.change_value > 0 ? '+' : ''}{Number(pair.change_percent).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">Strength:</span>
                        <Progress value={pair.strength} className="flex-1" />
                        <span className="text-xs">{pair.strength}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{pair.name}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Notifications */}
        {notifications.slice(0, 3).map((notification) => (
          <Card key={notification.id} className={`${
            notification.priority >= 4 ? 'border-trading-gold bg-trading-gold/5' : 'border-border'
          } ${notification.is_read ? 'opacity-60' : ''}`}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <AlertCircle className={`w-5 h-5 mr-3 ${
                  notification.type === 'signal' ? 'text-trading-gold' : 
                  notification.type === 'alert' ? 'text-destructive' : 'text-muted-foreground'
                }`} />
                <div>
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              {!notification.is_read && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  Mark Read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Alert for XAUUSD */}
        {currencyPairs.find(p => p.symbol === "XAUUSD")?.strength && currencyPairs.find(p => p.symbol === "XAUUSD")!.strength > 90 && (
          <Card className="border-trading-gold bg-trading-gold/5">
            <CardContent className="flex items-center p-4">
              <AlertCircle className="w-5 h-5 text-trading-gold mr-3" />
              <div>
                <div className="font-medium">High Confidence XAUUSD Signal</div>
                <div className="text-sm text-muted-foreground">
                  Gold showing {currencyPairs.find(p => p.symbol === "XAUUSD")?.strength}% signal strength - Consider this setup
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}