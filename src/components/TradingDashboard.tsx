import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Bell, TrendingUp, TrendingDown, Calculator, Target, AlertCircle } from "lucide-react";

const CURRENCY_PAIRS = [
  { symbol: "EURUSD", name: "Euro / US Dollar", price: 1.0842, change: 0.0023, changePercent: 0.21, signal: "BUY", strength: 85 },
  { symbol: "GBPUSD", name: "British Pound / US Dollar", price: 1.2674, change: -0.0012, changePercent: -0.09, signal: "NEUTRAL", strength: 45 },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen", price: 149.87, change: 0.45, changePercent: 0.30, signal: "SELL", strength: 78 },
  { symbol: "XAUUSD", name: "Gold / US Dollar", price: 2034.56, change: 12.34, changePercent: 0.61, signal: "BUY", strength: 92 },
  { symbol: "GBPJPY", name: "British Pound / Japanese Yen", price: 189.92, change: -0.23, changePercent: -0.12, signal: "NEUTRAL", strength: 38 },
  { symbol: "EURJPY", name: "Euro / Japanese Yen", price: 162.45, change: 0.78, changePercent: 0.48, signal: "BUY", strength: 73 },
  { symbol: "BTCUSD", name: "Bitcoin / US Dollar", price: 43247.89, change: 1234.56, changePercent: 2.94, signal: "BUY", strength: 88 },
  { symbol: "US100", name: "US Tech 100", price: 16842.34, change: -89.23, changePercent: -0.53, signal: "SELL", strength: 67 }
];

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
  
  // Focus on top 2 pairs with highest signal strength
  const topPairs = CURRENCY_PAIRS
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2);

  const calculatePosition = (pair: typeof CURRENCY_PAIRS[0]) => {
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
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
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
                    <div className="text-2xl font-bold">{pair.price}</div>
                    <div className={`flex items-center ${pair.change >= 0 ? 'text-trading-buy' : 'text-trading-sell'}`}>
                      {pair.change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {pair.change > 0 ? '+' : ''}{pair.change} ({pair.changePercent}%)
                    </div>
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
                  <div className="text-2xl font-bold">{CURRENCY_PAIRS.filter(p => p.signal !== "NEUTRAL").length}</div>
                  <p className="text-xs text-muted-foreground">
                    {CURRENCY_PAIRS.filter(p => p.signal === "BUY").length} Buy, {CURRENCY_PAIRS.filter(p => p.signal === "SELL").length} Sell signals
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
                    {Math.round(CURRENCY_PAIRS.reduce((acc, p) => acc + p.strength, 0) / CURRENCY_PAIRS.length)}%
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
                    {CURRENCY_PAIRS.find(p => p.symbol === "XAUUSD")?.strength}%
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
              {CURRENCY_PAIRS.map((pair) => (
                <Card key={pair.symbol}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{pair.symbol}</CardTitle>
                    <Badge variant={getSignalBadgeVariant(pair.signal)}>{pair.signal}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{pair.price}</span>
                        <span className={`text-sm ${pair.change >= 0 ? 'text-trading-buy' : 'text-trading-sell'}`}>
                          {pair.change > 0 ? '+' : ''}{pair.changePercent}%
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

        {/* Alert for XAUUSD */}
        {CURRENCY_PAIRS.find(p => p.symbol === "XAUUSD")?.strength && CURRENCY_PAIRS.find(p => p.symbol === "XAUUSD")!.strength > 90 && (
          <Card className="border-trading-gold bg-trading-gold/5">
            <CardContent className="flex items-center p-4">
              <AlertCircle className="w-5 h-5 text-trading-gold mr-3" />
              <div>
                <div className="font-medium">High Confidence XAUUSD Signal</div>
                <div className="text-sm text-muted-foreground">
                  Gold showing {CURRENCY_PAIRS.find(p => p.symbol === "XAUUSD")?.strength}% signal strength - Consider this setup
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}