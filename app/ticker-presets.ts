/**
 * 試算用標的預設（100 檔：ETF + 上市股票）
 * 股價、配息、殖利率為參考用示意，實際以市場與公司公告為準。
 * 產生：node scripts/gen-ticker-presets.mjs
 */
export type TickerFrequency = "month" | "quarter" | "semiannual" | "year";

export type TickerPreset = {
  id: string;
  label: string;
  annualReturn: number;
  frequency: TickerFrequency;
  price?: number;
  dividendPerPeriod?: number;
  dividendYieldPct?: number;
  stockDividendPct?: number;
  dividendMonths?: number[];
  /** 54C 應稅股利占現金股利占比（%），供二代健保試算 */
  ratio54c?: string;
};

export const TICKER_PRESETS: TickerPreset[] = [
    {
      id: "0050",
      label: "元大台灣50（0050）- ETF - 半年配 - 參考",
      annualReturn: 7,
      frequency: "semiannual" as TickerFrequency,
      price: 155,
      dividendPerPeriod: 1.85,
      dividendYieldPct: 2.4,
      stockDividendPct: 4.6,
      dividendMonths: [1, 7],
      ratio54c: "20"
    },
    {
      id: "0056",
      label: "元大高股息（0056）- ETF - 季配 - 參考",
      annualReturn: 7.5,
      frequency: "quarter" as TickerFrequency,
      price: 37.5,
      dividendPerPeriod: 0.97,
      dividendYieldPct: 10,
      stockDividendPct: 0,
      dividendMonths: [1, 4, 7, 10],
      ratio54c: "15"
    },
    {
      id: "006208",
      label: "富邦台50（006208）- ETF - 半年配 - 參考",
      annualReturn: 7,
      frequency: "semiannual" as TickerFrequency,
      price: 95,
      dividendPerPeriod: 1.4,
      dividendYieldPct: 2.9,
      stockDividendPct: 4.1,
      dividendMonths: [7, 11],
      ratio54c: "10"
    },
    {
      id: "00878",
      label: "國泰永續高股息（00878）- ETF - 季配 - 參考",
      annualReturn: 7.2,
      frequency: "quarter" as TickerFrequency,
      price: 21.75,
      dividendPerPeriod: 0.4,
      dividendYieldPct: 7.4,
      stockDividendPct: 0,
      dividendMonths: [2, 5, 8, 11],
      ratio54c: "15"
    },
    {
      id: "00900",
      label: "富邦特選高股息30（00900）- ETF - 季配 - 參考",
      annualReturn: 7.5,
      frequency: "quarter" as TickerFrequency,
      price: 13.8,
      dividendPerPeriod: 0.2,
      dividendYieldPct: 5.8,
      stockDividendPct: 1.7,
      dividendMonths: [2, 5, 8, 11],
      ratio54c: "5"
    },
    {
      id: "00919",
      label: "群益台灣精選高息（00919）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 23,
      dividendPerPeriod: 0.3,
      dividendYieldPct: 5.2,
      stockDividendPct: 2.8,
      dividendMonths: [3, 6, 9, 12],
      ratio54c: "10"
    },
    {
      id: "00929",
      label: "復華台灣科技高股息（00929）- ETF - 月配 - 參考",
      annualReturn: 8,
      frequency: "month" as TickerFrequency,
      price: 18.7,
      dividendPerPeriod: 0.08,
      dividendYieldPct: 5.1,
      stockDividendPct: 2.9,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      ratio54c: "10"
    },
    {
      id: "00934",
      label: "中信成長高股息（00934）- ETF - 月配 - 參考",
      annualReturn: 7.5,
      frequency: "month" as TickerFrequency,
      price: 22,
      dividendPerPeriod: 0.1,
      dividendYieldPct: 5.4,
      stockDividendPct: 2.1,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      ratio54c: "5"
    },
    {
      id: "00935",
      label: "野村臺灣新科技50（00935）- ETF - 半年配 - 參考",
      annualReturn: 7.5,
      frequency: "semiannual" as TickerFrequency,
      price: 37.5,
      dividendPerPeriod: 0.68,
      dividendYieldPct: 3.6,
      stockDividendPct: 3.9,
      dividendMonths: [3, 9],
      ratio54c: "5"
    },
    {
      id: "00940",
      label: "元大台灣價值高息（00940）- ETF - 季配 - 參考",
      annualReturn: 7.5,
      frequency: "quarter" as TickerFrequency,
      price: 9.5,
      dividendPerPeriod: 0.12,
      dividendYieldPct: 5.1,
      stockDividendPct: 2.4,
      dividendMonths: [1, 4, 7, 10],
      ratio54c: "5"
    },
    {
      id: "00646",
      label: "元大S&P500（00646）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 48,
      dividendPerPeriod: 0.35,
      dividendYieldPct: 2.9,
      stockDividendPct: 4.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00662",
      label: "富邦NASDAQ（00662）- ETF - 半年配 - 參考",
      annualReturn: 9.1,
      frequency: "semiannual" as TickerFrequency,
      price: 28,
      dividendPerPeriod: 0.4,
      dividendYieldPct: 2.8,
      stockDividendPct: 5.5,
      dividendMonths: [1, 7]
    },
    {
      id: "00752",
      label: "中信中國A50（00752）- ETF - 季配 - 參考",
      annualReturn: 7.7,
      frequency: "quarter" as TickerFrequency,
      price: 18,
      dividendPerPeriod: 0.25,
      dividendYieldPct: 5.5,
      stockDividendPct: 1.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00692",
      label: "富邦公司治理（00692）- ETF - 季配 - 參考",
      annualReturn: 8.5,
      frequency: "quarter" as TickerFrequency,
      price: 28,
      dividendPerPeriod: 0.5,
      dividendYieldPct: 7.1,
      stockDividendPct: 0.5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00701",
      label: "國泰股利精選30（00701）- ETF - 季配 - 參考",
      annualReturn: 7.9,
      frequency: "quarter" as TickerFrequency,
      price: 22,
      dividendPerPeriod: 0.28,
      dividendYieldPct: 5.1,
      stockDividendPct: 1.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00713",
      label: "元大台灣高息低波（00713）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 52,
      dividendPerPeriod: 0.65,
      dividendYieldPct: 5,
      stockDividendPct: 2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00728",
      label: "第一金工業30（00728）- ETF - 季配 - 參考",
      annualReturn: 7.4,
      frequency: "quarter" as TickerFrequency,
      price: 18,
      dividendPerPeriod: 0.22,
      dividendYieldPct: 4.9,
      stockDividendPct: 1.5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00731",
      label: "復華富時高息低波（00731）- ETF - 季配 - 參考",
      annualReturn: 7.5,
      frequency: "quarter" as TickerFrequency,
      price: 24,
      dividendPerPeriod: 0.32,
      dividendYieldPct: 5.3,
      stockDividendPct: 1.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00733",
      label: "富邦臺灣中小（00733）- ETF - 半年配 - 參考",
      annualReturn: 8.2,
      frequency: "semiannual" as TickerFrequency,
      price: 35,
      dividendPerPeriod: 0.55,
      dividendYieldPct: 3.1,
      stockDividendPct: 4.2,
      dividendMonths: [1, 7]
    },
    {
      id: "00735",
      label: "國泰臺韓科技（00735）- ETF - 半年配 - 參考",
      annualReturn: 7.4,
      frequency: "semiannual" as TickerFrequency,
      price: 32,
      dividendPerPeriod: 0.45,
      dividendYieldPct: 2.8,
      stockDividendPct: 3.5,
      dividendMonths: [1, 7]
    },
    {
      id: "00757",
      label: "統一FANG+（00757）- ETF - 季配 - 參考",
      annualReturn: 8.8,
      frequency: "quarter" as TickerFrequency,
      price: 42,
      dividendPerPeriod: 0.5,
      dividendYieldPct: 4.8,
      stockDividendPct: 3.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00762",
      label: "元大全球AI（00762）- ETF - 季配 - 參考",
      annualReturn: 8.3,
      frequency: "quarter" as TickerFrequency,
      price: 18,
      dividendPerPeriod: 0.15,
      dividendYieldPct: 3.3,
      stockDividendPct: 4.1,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00771",
      label: "國泰北美科技（00771）- ETF - 半年配 - 參考",
      annualReturn: 8.4,
      frequency: "semiannual" as TickerFrequency,
      price: 38,
      dividendPerPeriod: 0.48,
      dividendYieldPct: 2.5,
      stockDividendPct: 5,
      dividendMonths: [1, 7]
    },
    {
      id: "00830",
      label: "國泰費城半導體（00830）- ETF - 季配 - 參考",
      annualReturn: 8.4,
      frequency: "quarter" as TickerFrequency,
      price: 45,
      dividendPerPeriod: 0.42,
      dividendYieldPct: 3.7,
      stockDividendPct: 3.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00850",
      label: "元大臺灣ESG永續（00850）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 26,
      dividendPerPeriod: 0.35,
      dividendYieldPct: 5.4,
      stockDividendPct: 1.6,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00881",
      label: "國泰台灣科技龍頭（00881）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 21,
      dividendPerPeriod: 0.3,
      dividendYieldPct: 5.7,
      stockDividendPct: 1.4,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00885",
      label: "富邦越南（00885）- ETF - 半年配 - 參考",
      annualReturn: 7.2,
      frequency: "semiannual" as TickerFrequency,
      price: 15,
      dividendPerPeriod: 0.25,
      dividendYieldPct: 3.3,
      stockDividendPct: 2.8,
      dividendMonths: [1, 7]
    },
    {
      id: "00891",
      label: "中信美國市政債（00891）- ETF - 月配 - 參考",
      annualReturn: 5.5,
      frequency: "month" as TickerFrequency,
      price: 35,
      dividendPerPeriod: 0.12,
      dividendYieldPct: 4.1,
      stockDividendPct: 0,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "00905",
      label: "富邦信用債1-5Y（00905）- ETF - 月配 - 參考",
      annualReturn: 5.2,
      frequency: "month" as TickerFrequency,
      price: 32,
      dividendPerPeriod: 0.1,
      dividendYieldPct: 3.8,
      stockDividendPct: 0,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "00909",
      label: "國泰數位支付服務（00909）- ETF - 季配 - 參考",
      annualReturn: 7.8,
      frequency: "quarter" as TickerFrequency,
      price: 20,
      dividendPerPeriod: 0.18,
      dividendYieldPct: 3.6,
      stockDividendPct: 3.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00913",
      label: "兆豐台灣晶圓製造（00913）- ETF - 季配 - 參考",
      annualReturn: 7.7,
      frequency: "quarter" as TickerFrequency,
      price: 24,
      dividendPerPeriod: 0.25,
      dividendYieldPct: 4.2,
      stockDividendPct: 2.5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00915",
      label: "凱基優選高股息30（00915）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 17,
      dividendPerPeriod: 0.22,
      dividendYieldPct: 5.2,
      stockDividendPct: 1.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00918",
      label: "大華優利高填息30（00918）- ETF - 季配 - 參考",
      annualReturn: 8.1,
      frequency: "quarter" as TickerFrequency,
      price: 18,
      dividendPerPeriod: 0.25,
      dividendYieldPct: 5.6,
      stockDividendPct: 1.6,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00922",
      label: "國泰台灣領袖50（00922）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 30,
      dividendPerPeriod: 0.38,
      dividendYieldPct: 5.1,
      stockDividendPct: 2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00923",
      label: "群益台ESG低碳50（00923）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 19,
      dividendPerPeriod: 0.24,
      dividendYieldPct: 5,
      stockDividendPct: 2.1,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00924",
      label: "復華S&P500成長（00924）- ETF - 半年配 - 參考",
      annualReturn: 7.7,
      frequency: "semiannual" as TickerFrequency,
      price: 36,
      dividendPerPeriod: 0.4,
      dividendYieldPct: 2.2,
      stockDividendPct: 4.5,
      dividendMonths: [1, 7]
    },
    {
      id: "00926",
      label: "凱基台灣5G+（00926）- ETF - 季配 - 參考",
      annualReturn: 8.1,
      frequency: "quarter" as TickerFrequency,
      price: 16,
      dividendPerPeriod: 0.2,
      dividendYieldPct: 5,
      stockDividendPct: 2.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00927",
      label: "群益台灣中小型股（00927）- ETF - 季配 - 參考",
      annualReturn: 8,
      frequency: "quarter" as TickerFrequency,
      price: 22,
      dividendPerPeriod: 0.28,
      dividendYieldPct: 5.1,
      stockDividendPct: 1.9,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00932",
      label: "宏大台灣ESG永續高息（00932）- ETF - 月配 - 參考",
      annualReturn: 10,
      frequency: "month" as TickerFrequency,
      price: 14,
      dividendPerPeriod: 0.11,
      dividendYieldPct: 9.4,
      stockDividendPct: 0,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "00936",
      label: "台新永續高息中小（00936）- ETF - 季配 - 參考",
      annualReturn: 8.1,
      frequency: "quarter" as TickerFrequency,
      price: 19,
      dividendPerPeriod: 0.26,
      dividendYieldPct: 5.5,
      stockDividendPct: 1.7,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00939",
      label: "統一台灣高息動能（00939）- ETF - 月配 - 參考",
      annualReturn: 7.8,
      frequency: "month" as TickerFrequency,
      price: 15,
      dividendPerPeriod: 0.06,
      dividendYieldPct: 4.8,
      stockDividendPct: 2,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "00943",
      label: "兆豐電子高息等權（00943）- ETF - 季配 - 參考",
      annualReturn: 7.8,
      frequency: "quarter" as TickerFrequency,
      price: 20,
      dividendPerPeriod: 0.24,
      dividendYieldPct: 4.8,
      stockDividendPct: 2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00944",
      label: "新光台灣高息（00944）- ETF - 季配 - 參考",
      annualReturn: 7.8,
      frequency: "quarter" as TickerFrequency,
      price: 12,
      dividendPerPeriod: 0.15,
      dividendYieldPct: 5,
      stockDividendPct: 1.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00945",
      label: "兆豐龍頭等權重（00945）- ETF - 季配 - 參考",
      annualReturn: 7.9,
      frequency: "quarter" as TickerFrequency,
      price: 16,
      dividendPerPeriod: 0.2,
      dividendYieldPct: 5,
      stockDividendPct: 1.9,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00946",
      label: "群益台灣科技高息（00946）- ETF - 月配 - 參考",
      annualReturn: 9.4,
      frequency: "month" as TickerFrequency,
      price: 10,
      dividendPerPeriod: 0.06,
      dividendYieldPct: 7.2,
      stockDividendPct: 1.5,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "00947",
      label: "新光台灣半導體30（00947）- ETF - 季配 - 參考",
      annualReturn: 7.9,
      frequency: "quarter" as TickerFrequency,
      price: 14,
      dividendPerPeriod: 0.18,
      dividendYieldPct: 5.1,
      stockDividendPct: 1.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00949",
      label: "凱基台灣AI50（00949）- ETF - 季配 - 參考",
      annualReturn: 8.1,
      frequency: "quarter" as TickerFrequency,
      price: 18,
      dividendPerPeriod: 0.22,
      dividendYieldPct: 4.9,
      stockDividendPct: 2.3,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00951",
      label: "台新美國標普500（00951）- ETF - 半年配 - 參考",
      annualReturn: 8,
      frequency: "semiannual" as TickerFrequency,
      price: 33,
      dividendPerPeriod: 0.38,
      dividendYieldPct: 2.3,
      stockDividendPct: 4.8,
      dividendMonths: [1, 7]
    },
    {
      id: "00952",
      label: "凱基台灣電力設施（00952）- ETF - 季配 - 參考",
      annualReturn: 7.7,
      frequency: "quarter" as TickerFrequency,
      price: 17,
      dividendPerPeriod: 0.21,
      dividendYieldPct: 4.9,
      stockDividendPct: 1.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00954",
      label: "富邦臺灣中英德50（00954）- ETF - 季配 - 參考",
      annualReturn: 7.8,
      frequency: "quarter" as TickerFrequency,
      price: 25,
      dividendPerPeriod: 0.3,
      dividendYieldPct: 4.8,
      stockDividendPct: 2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00956",
      label: "中信台灣智慧綠能（00956）- ETF - 季配 - 參考",
      annualReturn: 7.8,
      frequency: "quarter" as TickerFrequency,
      price: 15,
      dividendPerPeriod: 0.18,
      dividendYieldPct: 4.8,
      stockDividendPct: 2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00960",
      label: "元大台灣金融高息（00960）- ETF - 月配 - 參考",
      annualReturn: 9.8,
      frequency: "month" as TickerFrequency,
      price: 13,
      dividendPerPeriod: 0.1,
      dividendYieldPct: 9.2,
      stockDividendPct: 0,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "00961",
      label: "元大投資級公司債（00961）- ETF - 月配 - 參考",
      annualReturn: 6,
      frequency: "month" as TickerFrequency,
      price: 28,
      dividendPerPeriod: 0.11,
      dividendYieldPct: 4.7,
      stockDividendPct: 0,
      dividendMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
      id: "00962",
      label: "中信電池及儲能（00962）- ETF - 季配 - 參考",
      annualReturn: 7.8,
      frequency: "quarter" as TickerFrequency,
      price: 16,
      dividendPerPeriod: 0.19,
      dividendYieldPct: 4.8,
      stockDividendPct: 2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "00971",
      label: "野村美國研發龍頭（00971）- ETF - 半年配 - 參考",
      annualReturn: 7.7,
      frequency: "semiannual" as TickerFrequency,
      price: 22,
      dividendPerPeriod: 0.28,
      dividendYieldPct: 2.5,
      stockDividendPct: 4.2,
      dividendMonths: [1, 7]
    },
    {
      id: "2330",
      label: "台積電（2330）- 股票 - 季配 - 參考",
      annualReturn: 7.7,
      frequency: "quarter" as TickerFrequency,
      price: 1085,
      dividendPerPeriod: 4.5,
      dividendYieldPct: 1.7,
      stockDividendPct: 5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "2317",
      label: "鴻海（2317）- 股票 - 年配 - 參考",
      annualReturn: 7.4,
      frequency: "year" as TickerFrequency,
      price: 185,
      dividendPerPeriod: 5.2,
      dividendYieldPct: 2.8,
      stockDividendPct: 3.5,
      dividendMonths: [7]
    },
    {
      id: "2454",
      label: "聯發科（2454）- 股票 - 季配 - 參考",
      annualReturn: 6.3,
      frequency: "quarter" as TickerFrequency,
      price: 980,
      dividendPerPeriod: 12,
      dividendYieldPct: 1.2,
      stockDividendPct: 3.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "2308",
      label: "台達電（2308）- 股票 - 季配 - 參考",
      annualReturn: 8.5,
      frequency: "quarter" as TickerFrequency,
      price: 285,
      dividendPerPeriod: 3.2,
      dividendYieldPct: 4.5,
      stockDividendPct: 3.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "2882",
      label: "國泰金（2882）- 股票 - 年配 - 參考",
      annualReturn: 7.4,
      frequency: "year" as TickerFrequency,
      price: 48,
      dividendPerPeriod: 1.8,
      dividendYieldPct: 3.8,
      stockDividendPct: 2.5,
      dividendMonths: [7]
    },
    {
      id: "2881",
      label: "富邦金（2881）- 股票 - 年配 - 參考",
      annualReturn: 8.5,
      frequency: "year" as TickerFrequency,
      price: 72,
      dividendPerPeriod: 3.5,
      dividendYieldPct: 4.9,
      stockDividendPct: 2.8,
      dividendMonths: [7]
    },
    {
      id: "2891",
      label: "中信金（2891）- 股票 - 年配 - 參考",
      annualReturn: 6.4,
      frequency: "year" as TickerFrequency,
      price: 38,
      dividendPerPeriod: 1.2,
      dividendYieldPct: 3.2,
      stockDividendPct: 2,
      dividendMonths: [7]
    },
    {
      id: "2886",
      label: "兆豐金（2886）- 股票 - 年配 - 參考",
      annualReturn: 6.3,
      frequency: "year" as TickerFrequency,
      price: 35,
      dividendPerPeriod: 1.1,
      dividendYieldPct: 3.1,
      stockDividendPct: 2,
      dividendMonths: [7]
    },
    {
      id: "2382",
      label: "廣達（2382）- 股票 - 年配 - 參考",
      annualReturn: 7.5,
      frequency: "year" as TickerFrequency,
      price: 220,
      dividendPerPeriod: 4.5,
      dividendYieldPct: 2,
      stockDividendPct: 4.5,
      dividendMonths: [7]
    },
    {
      id: "2412",
      label: "中華電（2412）- 股票 - 年配 - 參考",
      annualReturn: 7.1,
      frequency: "year" as TickerFrequency,
      price: 125,
      dividendPerPeriod: 4.8,
      dividendYieldPct: 3.8,
      stockDividendPct: 2.2,
      dividendMonths: [7]
    },
    {
      id: "3711",
      label: "日月光投控（3711）- 股票 - 季配 - 參考",
      annualReturn: 10,
      frequency: "quarter" as TickerFrequency,
      price: 145,
      dividendPerPeriod: 2.5,
      dividendYieldPct: 6.9,
      stockDividendPct: 2.5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "3034",
      label: "聯詠（3034）- 股票 - 季配 - 參考",
      annualReturn: 6.8,
      frequency: "quarter" as TickerFrequency,
      price: 520,
      dividendPerPeriod: 8,
      dividendYieldPct: 1.5,
      stockDividendPct: 4.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "2303",
      label: "聯電（2303）- 股票 - 季配 - 參考",
      annualReturn: 6.9,
      frequency: "quarter" as TickerFrequency,
      price: 48,
      dividendPerPeriod: 0.45,
      dividendYieldPct: 3.8,
      stockDividendPct: 2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "3008",
      label: "大立光（3008）- 股票 - 年配 - 參考",
      annualReturn: 7.5,
      frequency: "year" as TickerFrequency,
      price: 2180,
      dividendPerPeriod: 65,
      dividendYieldPct: 3,
      stockDividendPct: 3.5,
      dividendMonths: [7]
    },
    {
      id: "6669",
      label: "緯穎（6669）- 股票 - 季配 - 參考",
      annualReturn: 6.8,
      frequency: "quarter" as TickerFrequency,
      price: 1780,
      dividendPerPeriod: 25,
      dividendYieldPct: 1.4,
      stockDividendPct: 4.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "3037",
      label: "欣興（3037）- 股票 - 季配 - 參考",
      annualReturn: 9,
      frequency: "quarter" as TickerFrequency,
      price: 185,
      dividendPerPeriod: 2.5,
      dividendYieldPct: 5.4,
      stockDividendPct: 2.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "2379",
      label: "瑞昱（2379）- 股票 - 季配 - 參考",
      annualReturn: 6.7,
      frequency: "quarter" as TickerFrequency,
      price: 520,
      dividendPerPeriod: 8,
      dividendYieldPct: 1.5,
      stockDividendPct: 4,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "3443",
      label: "創意（3443）- 股票 - 季配 - 參考",
      annualReturn: 7.4,
      frequency: "quarter" as TickerFrequency,
      price: 680,
      dividendPerPeriod: 12,
      dividendYieldPct: 1.8,
      stockDividendPct: 4.5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "3231",
      label: "緯創（3231）- 股票 - 季配 - 參考",
      annualReturn: 8.6,
      frequency: "quarter" as TickerFrequency,
      price: 95,
      dividendPerPeriod: 1.2,
      dividendYieldPct: 5,
      stockDividendPct: 2.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "3661",
      label: "世芯-KY（3661）- 股票 - 季配 - 參考",
      annualReturn: 7.9,
      frequency: "quarter" as TickerFrequency,
      price: 2450,
      dividendPerPeriod: 35,
      dividendYieldPct: 1.4,
      stockDividendPct: 5.5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "4919",
      label: "新光金（4919）- 股票 - 年配 - 參考",
      annualReturn: 3.9,
      frequency: "year" as TickerFrequency,
      price: 12,
      dividendPerPeriod: 0.15,
      dividendYieldPct: 1.2,
      stockDividendPct: 1,
      dividendMonths: [7]
    },
    {
      id: "5871",
      label: "中租-KY（5871）- 股票 - 季配 - 參考",
      annualReturn: 10.7,
      frequency: "quarter" as TickerFrequency,
      price: 285,
      dividendPerPeriod: 5.5,
      dividendYieldPct: 7.7,
      stockDividendPct: 2.5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "3045",
      label: "台灣大（3045）- 股票 - 年配 - 參考",
      annualReturn: 7.6,
      frequency: "year" as TickerFrequency,
      price: 115,
      dividendPerPeriod: 5.5,
      dividendYieldPct: 4.8,
      stockDividendPct: 1.8,
      dividendMonths: [7]
    },
    {
      id: "2357",
      label: "華碩（2357）- 股票 - 年配 - 參考",
      annualReturn: 7.4,
      frequency: "year" as TickerFrequency,
      price: 485,
      dividendPerPeriod: 12,
      dividendYieldPct: 2.5,
      stockDividendPct: 3.8,
      dividendMonths: [7]
    },
    {
      id: "2395",
      label: "研華（2395）- 股票 - 年配 - 參考",
      annualReturn: 7.2,
      frequency: "year" as TickerFrequency,
      price: 380,
      dividendPerPeriod: 10,
      dividendYieldPct: 2.6,
      stockDividendPct: 3.5,
      dividendMonths: [7]
    },
    {
      id: "2603",
      label: "長榮（2603）- 股票 - 年配 - 參考",
      annualReturn: 8.8,
      frequency: "year" as TickerFrequency,
      price: 168,
      dividendPerPeriod: 5,
      dividendYieldPct: 3,
      stockDividendPct: 5,
      dividendMonths: [7]
    },
    {
      id: "2609",
      label: "陽明（2609）- 股票 - 年配 - 參考",
      annualReturn: 8.5,
      frequency: "year" as TickerFrequency,
      price: 72,
      dividendPerPeriod: 2.5,
      dividendYieldPct: 3.5,
      stockDividendPct: 4.2,
      dividendMonths: [7]
    },
    {
      id: "2615",
      label: "萬海（2615）- 股票 - 年配 - 參考",
      annualReturn: 8.2,
      frequency: "year" as TickerFrequency,
      price: 85,
      dividendPerPeriod: 3,
      dividendYieldPct: 3.5,
      stockDividendPct: 3.8,
      dividendMonths: [7]
    },
    {
      id: "2912",
      label: "統一超（2912）- 股票 - 年配 - 參考",
      annualReturn: 6.8,
      frequency: "year" as TickerFrequency,
      price: 268,
      dividendPerPeriod: 8.5,
      dividendYieldPct: 3.2,
      stockDividendPct: 2.5,
      dividendMonths: [7]
    },
    {
      id: "1216",
      label: "統一（1216）- 股票 - 年配 - 參考",
      annualReturn: 6.9,
      frequency: "year" as TickerFrequency,
      price: 78,
      dividendPerPeriod: 2.8,
      dividendYieldPct: 3.6,
      stockDividendPct: 2.2,
      dividendMonths: [7]
    },
    {
      id: "2207",
      label: "和泰車（2207）- 股票 - 年配 - 參考",
      annualReturn: 6.6,
      frequency: "year" as TickerFrequency,
      price: 628,
      dividendPerPeriod: 15,
      dividendYieldPct: 2.4,
      stockDividendPct: 3,
      dividendMonths: [7]
    },
    {
      id: "1590",
      label: "亞德客-KY（1590）- 股票 - 年配 - 參考",
      annualReturn: 6.8,
      frequency: "year" as TickerFrequency,
      price: 720,
      dividendPerPeriod: 18,
      dividendYieldPct: 2.5,
      stockDividendPct: 3.2,
      dividendMonths: [7]
    },
    {
      id: "2049",
      label: "上銀（2049）- 股票 - 年配 - 參考",
      annualReturn: 6.3,
      frequency: "year" as TickerFrequency,
      price: 1850,
      dividendPerPeriod: 28,
      dividendYieldPct: 1.5,
      stockDividendPct: 3.5,
      dividendMonths: [7]
    },
    {
      id: "3653",
      label: "健策（3653）- 股票 - 季配 - 參考",
      annualReturn: 6.8,
      frequency: "quarter" as TickerFrequency,
      price: 520,
      dividendPerPeriod: 6,
      dividendYieldPct: 1.2,
      stockDividendPct: 4.5,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "1301",
      label: "台塑（1301）- 股票 - 年配 - 參考",
      annualReturn: 6.9,
      frequency: "year" as TickerFrequency,
      price: 48,
      dividendPerPeriod: 1.8,
      dividendYieldPct: 3.8,
      stockDividendPct: 2,
      dividendMonths: [7]
    },
    {
      id: "1326",
      label: "台化（1326）- 股票 - 年配 - 參考",
      annualReturn: 6.6,
      frequency: "year" as TickerFrequency,
      price: 42,
      dividendPerPeriod: 1.5,
      dividendYieldPct: 3.6,
      stockDividendPct: 1.8,
      dividendMonths: [7]
    },
    {
      id: "2002",
      label: "中鋼（2002）- 股票 - 年配 - 參考",
      annualReturn: 5.2,
      frequency: "year" as TickerFrequency,
      price: 22,
      dividendPerPeriod: 0.5,
      dividendYieldPct: 2.3,
      stockDividendPct: 1.5,
      dividendMonths: [7]
    },
    {
      id: "2201",
      label: "裕隆（2201）- 股票 - 年配 - 參考",
      annualReturn: 5.9,
      frequency: "year" as TickerFrequency,
      price: 85,
      dividendPerPeriod: 2.2,
      dividendYieldPct: 2.6,
      stockDividendPct: 2,
      dividendMonths: [7]
    },
    {
      id: "2327",
      label: "國巨*（2327）- 股票 - 季配 - 參考",
      annualReturn: 7.1,
      frequency: "quarter" as TickerFrequency,
      price: 185,
      dividendPerPeriod: 3,
      dividendYieldPct: 3.2,
      stockDividendPct: 2.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "2345",
      label: "智邦（2345）- 股票 - 季配 - 參考",
      annualReturn: 7.2,
      frequency: "quarter" as TickerFrequency,
      price: 420,
      dividendPerPeriod: 5.5,
      dividendYieldPct: 1.3,
      stockDividendPct: 4.8,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "2354",
      label: "鴻準（2354）- 股票 - 年配 - 參考",
      annualReturn: 6.3,
      frequency: "year" as TickerFrequency,
      price: 72,
      dividendPerPeriod: 2,
      dividendYieldPct: 2.8,
      stockDividendPct: 2.2,
      dividendMonths: [7]
    },
    {
      id: "2376",
      label: "技嘉（2376）- 股票 - 季配 - 參考",
      annualReturn: 7.3,
      frequency: "quarter" as TickerFrequency,
      price: 185,
      dividendPerPeriod: 3.5,
      dividendYieldPct: 2,
      stockDividendPct: 4.2,
      dividendMonths: [2, 5, 8, 11]
    },
    {
      id: "2408",
      label: "南亞科（2408）- 股票 - 年配 - 參考",
      annualReturn: 6.6,
      frequency: "year" as TickerFrequency,
      price: 485,
      dividendPerPeriod: 8,
      dividendYieldPct: 1.6,
      stockDividendPct: 3.8,
      dividendMonths: [7]
    },
    {
      id: "2409",
      label: "友達（2409）- 股票 - 年配 - 參考",
      annualReturn: 4.6,
      frequency: "year" as TickerFrequency,
      price: 16,
      dividendPerPeriod: 0.3,
      dividendYieldPct: 1.9,
      stockDividendPct: 1.2,
      dividendMonths: [7]
    },
    {
      id: "2439",
      label: "美律（2439）- 股票 - 季配 - 參考",
      annualReturn: 7.7,
      frequency: "quarter" as TickerFrequency,
      price: 185,
      dividendPerPeriod: 3,
      dividendYieldPct: 3.2,
      stockDividendPct: 3.5,
      dividendMonths: [2, 5, 8, 11]
    }
];

const M12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** 各標的除息月份（1～12），供股利再投入試算 */
export function buildTickerDividendMonthsMap(): Record<string, number[]> {
  const m: Record<string, number[]> = {};
  for (const p of TICKER_PRESETS) {
    m[p.id] = [...(p.dividendMonths ?? [...M12])];
  }
  return m;
}

/** 54C 占比預設（%）；未設定者預設 10 */
export function buildDefault54cRatioMap(): Record<string, string> {
  const o: Record<string, string> = {};
  for (const p of TICKER_PRESETS) {
    o[p.id] = p.ratio54c ?? "10";
  }
  return o;
}
