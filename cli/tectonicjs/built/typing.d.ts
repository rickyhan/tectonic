export interface ExchangeState {
    H: string;
    M: 'updateExchangeState';
    A: [ExchangeStateUpdate];
}
export declare type Side = 'SELL' | 'BUY';
export declare type UpdateType = 0 | 1 | 2;
export interface ExchangeStateUpdate {
    MarketName: string;
    Nounce: number;
    Buys: [Buy];
    Sells: [Sell];
    Fills: [Fill];
}
export declare type Sell = Buy;
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
export interface UnhandledData {
    unhandled_data: {
        R: boolean;
        I: string;
    };
}
export declare type ExchangeCallback = (value: ExchangeStateUpdate, index?: number, array?: ExchangeStateUpdate[]) => void;
export declare type SummaryCallback = (value: PairUpdate, index?: number, array?: PairUpdate[]) => void;
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
