export enum LogModule {
	HARVEST = 1,
	COMPANY = 2,
	COST_CENTER = 3,
	HARVEST_MATERIAL = 4,
	COUNTRY = 5,
	CURRENCY = 6,
	INVENTORY_LOCATION = 7,
	MATRIX_DISTRIBUITION = 8,
	ITEM = 9,
	ITEM_FAMILY = 10,
	ITEM_GROUP = 11,
	PURCHASE_REQUEST = 12,
	STOCK_MOVEMENT = 13,
	STATE = 14,
	SUPLIER_CLIENT = 15,
	UNIT_MEASUREMENT = 16,
	STOCK_TRANSFER_REQUEST = 17,
	BRANCH = 18,
	CITY = 19,
	CURRENCY_CATEGORY = 23, //MANTER IGUAL DO BANCO DE DADOS
	CURRENCY_QUOTE = 24,
	ITEM_INVENTORY = 25,
	ITEM_PRICE = 26,
	PROJECTS = 27,
	STOCK_REVALUATION = 28,
	PURCHASE_ORDER = 29,
	CONTRACT = 30,
	BATCH = 31,
	SITUATION_HISTORY = 32,
	PAYMENT_CONDITION = 33,
	SALE_ORDER = 34,
	DOWN_PAYMENT = 35,
	INVOICE = 36,
	INVOICE_RETURN = 37,
	INVOICE_DOWN = 38,
	INVOICE_DOWN_DELETE = 39,
	INVOICE_ANTECIPATION = 40,
	INVOICE_ANTECIPATION_DELETE = 41,
	STOCK_MOVEMENT_REQUEST = 42,
	TRANSACTION = 43,
	INVOICE_CANCELATION = 44,
	ACCOUNT_PAYMENT = 45,
	LEDGER_ACCOUNT = 46,
	PAYMENT_INSTALLMENT = 47,
	LEDGER_ACCOUNT_VALUE = 48,
	ACCOUNT_ORIGIN = 49,
}

export enum LogType {
	ERROR = 1,
	SUCCESS = 2,
	INFORMATION = 3,
	BUSINESS = 4
}

export interface Log {
	LOGTYPECODE: LogType;
	MODULE: LogModule;
	MESSAGE: string;
	FULLMESSAGE: string;
	KEY: string;
	REQUESTOBJECT: any;
	RESPONSEOBJECT: any;
}


export interface LogSuccessRequest {
	key: string,
	message?: string,
	module: LogModule,
	requestObject: any,
	responseObject: any
}

export interface LogErrorRequest {
	key: string,
	module: LogModule,
	requestObject?: any,
	exception: any
}

