// types
//================================

export interface ExchangeState {
     H: string; // Hub
     M: 'updateExchangeState';
     A: [ExchangeStateUpdate];
}

export type Side = 'SELL' | 'BUY';
export type UpdateType = 0 // new order entries at matching price, add to orderbook
                       | 1 // cancelled / filled order entries at matching price, delete from orderbook
                       | 2 // changed order entries at matching price (partial fills, cancellations), edit in orderbook
                       ;

export interface ExchangeStateUpdate {
    MarketName: string; // BTC-NEO
    Nounce: number;
    Buys: [Buy];
    Sells: [Sell];
    Fills: [Fill];
}

export type Sell = Buy;

export interface Buy {
    Type: UpdateType;
    Rate: number;
    Quantity: number;
}

export interface Fill {
    OrderType: Side;
    Rate: number;
    Quantity: number;
    TimeStamp: string;
}

//================================

export interface SummaryState {
    H: string;
    M: 'updateSummaryState';
    A: [SummaryStateUpdate];
}

export interface SummaryStateUpdate {
    Nounce: number;
    Deltas: [PairUpdate];
}

export interface PairUpdate {
    MarketName: string;
    High: number;
    Low: number;
    Volume: number;
    Last: number;
    BaseVolume: number;
    TimeStamp: string;
    Bid: number;
    Ask: number;
    OpenBuyOrders: number;
    OpenSellOrders: number;
    PrevDay: number;
    Created: string;
}

//================================

export interface UnhandledData {
    unhandled_data: {
        R: boolean, // true,
        I: string,  // '1'
    };
}

//================================
//callbacks

export type ExchangeCallback = (value: ExchangeStateUpdate, index?: number, array?: ExchangeStateUpdate[]) => void;
export type SummaryCallback = (value: PairUpdate, index?: number, array?: PairUpdate[]) => void;

//================================
//db updates

export interface DBUpdate {
    pair: string;
    seq: number;
    is_trade: boolean;
    is_bid: boolean;
    price: number;
    size: number;
    timestamp: number;
    type: number;
}
