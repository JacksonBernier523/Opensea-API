import BigNumber from 'bignumber.js'
import * as Web3 from 'web3'
import {
  Network,
  HowToCall,
  // Note: Wyvern SaleKind is wrong!
  ECSignature,
  Order as WyvernOrder
} from 'wyvern-js/lib/types'

export {
  Network,
  HowToCall,
  ECSignature
}

/**
 * Events emitted by the SDK. There are three types:
 * 1. transaction events, which tell you when a new transaction was
 *    created, confirmed, or failed
 * 2. pre-transaction events, which are named (like "WrapEth") and indicate
 *    that Web3 is asking for a signature on a transaction
 * 3. One "CreateOrder" event, which fires when a signature is being prompted to create an off-chain order
 */
export enum EventType {
  TransactionCreated = "TransactionCreated",
  TransactionConfirmed = "TransactionConfirmed",
  TransactionFailed = "TransactionFailed",

  InitializeAccount = "InitializeAccount",

  WrapEth = "WrapEth",
  UnwrapWeth = "UnwrapWeth",

  ApproveCurrency = "ApproveCurrency",
  ApproveAsset = "ApproveAsset",
  ApproveAllAssets = "ApproveAllAssets",

  MatchOrders = "MatchOrders",
  CancelOrder = "CancelOrder",

  CreateOrder = "CreateOrder",
}

/**
 * Data that gets sent with each EventType
 */
export interface EventData {
  accountAddress?: string
  proxyAddress?: string
  amount?: BigNumber
  tokenAddress?: string
  tokenId?: string

  transactionHash?: string
  event?: EventType
  error?: Error

  order?: Order | UnsignedOrder
  buy?: Order
  sell?: Order
}

export interface OpenSeaAPIConfig {
  networkName?: Network
  apiKey?: string
  // Sent to WyvernJS
  gasPrice?: BigNumber
}

/**
 * Wyvern order side: buy or sell.
 */
export enum OrderSide {
  Buy = 0,
  Sell = 1,
}

/**
 * Wyvern fee method
 * ProtocolFee: Charge maker fee to seller and charge taker fee to buyer.
 * SplitFee: Maker fees are deducted from the token amount that the maker receives. Taker fees are extra tokens that must be paid by the taker.
 */
export enum FeeMethod {
  ProtocolFee = 0,
  SplitFee = 1,
}

/**
 * Wyvern: type of sale. Fixed or Dutch auction
 * Note: not imported from wyvern.js because it uses
 * EnglishAuction as 1 and DutchAuction as 2
 */
export enum SaleKind {
  FixedPrice = 0,
  DutchAuction = 1,
}

// Wyvern Schemas (see https://github.com/ProjectOpenSea/wyvern-schemas)
export enum WyvernSchemaName {
  ERC721 = 'ERC721'
}

export interface WyvernAsset {
  id: string
  address: string
}

export type WyvernAtomicMatchParameters = [string[], BigNumber[], Array<(number | BigNumber)>, string, string, string, string, string, string, Array<(number | BigNumber)>, string[]]

/**
 * The OpenSea account object appended to orders, providing extra metadata, profile images and usernames
 */
export interface OpenSeaAccount {
  // Wallet address for this account
  address: string
  // Public configuration info, including "affiliate" for users who are in the OpenSea affiliate program
  config: string
  // This account's profile image - by default, randomly generated by the server
  profile_img_url: string

  // More information explicitly set by this account's owner on OpenSea
  user: null | {
    // Username for this account
    username: string;
  }
}

/**
 * The OpenSea asset fetched by the API
 */
export interface OpenSeaAsset {
  assetContract: {
    // Name of the asset's contract
    name: string;
    // Address of this contract
    address: OpenSeaAccount;
    // Fee levied on sellers by this contract, in basis points
    sellerFeeBasisPoints: number;
    // Fee levied on buyers by this contract, in basis points
    buyerFeeBasisPoints: number;
    // Description of the contract
    description: string;
    // Contract's Etherscan / OpenSea symbol
    tokenSymbol: string;
    // Image for the contract
    imageUrl: string;
    // Object with stats about the contract
    stats?: object;
    // Array of trait types for the contract
    traits?: object[];
    // Link to the contract's main website
    externalLink?: string;
    // Link to the contract's wiki, if available
    wikiLink?: string;
  }
  // The asset's given name
  name: string
  // The asset's token ID
  tokenId: string
  // Owner of the asset
  owner: OpenSeaAccount
  // Orders on the asset. Null if asset was fetched in a list
  orders: Order[] | null
  // Buy orders (offers) on the asset. Null if asset in a list and didn't prefetch buy orders
  buyOrders: Order[] | null
  // Sell orders (auctions) on the asset. Null if asset in a list and didn't prefetch sell orders
  sellOrders: Order[] | null

  // Whether the asset is on a pre-sale (so token ids aren't real)
  isPresale: boolean
  // The cached and size-optimized image url for this token
  imageUrl: string
  // The image preview url for this token.
  // Note: Loses gif animation and may have issues with SVGs
  imagePreviewUrl: string
  // The original image url for this token
  imageUrlOriginal: string
  // Thumbnail url for this token
  imageUrlThumbnail: string
  // Link to token on OpenSea
  openseaLink: string
  // Link to token on dapp's site
  externalLink: string
  // Array of traits on this token
  traits: object[],
  // Number of times this token has been traded (sold)
  numSales: number
  // Data about the last time this token was sold
  lastSale: object | null
  // The suggested background color for the image url
  backgroundColor: string | null
}

/**
 * Bundles of assets, grouped together into one OpenSea order
 * URLs for bundles are auto-generated from the name
 */
export interface OpenSeaAssetBundle {
  assets: OpenSeaAsset[]
  name: string
  slug: string
  permalink: string

  // Sell orders (auctions) on the bundle. Null if bundle in a list and didn't prefetch sell orders
  sellOrders: Order[] | null

  description?: string
  externalLink?: string
}

export interface OpenSeaAssetBundleJSON {
  assets: WyvernAsset[]
  name: string
  description?: string
  external_link?: string

  // From API only
  maker?: OpenSeaAccount

  // For querying
  asset_contract_address?: string
  token_ids?: Array<number | string>
  on_sale?: boolean
  owner?: string
  offset?: number
  limit?: number
  search?: string
}

export interface UnhashedOrder extends WyvernOrder {
  feeMethod: FeeMethod
  side: OrderSide
  saleKind: SaleKind
  howToCall: HowToCall

  metadata: {
    asset?: WyvernAsset;
    bundle?: OpenSeaAssetBundleJSON;
    schema: WyvernSchemaName;
  }
}

export interface UnsignedOrder extends UnhashedOrder {
  hash: string
}

export interface Order extends UnsignedOrder, ECSignature {
  // Read-only server-side appends
  currentPrice?: BigNumber
  makerAccount?: OpenSeaAccount
  takerAccount?: OpenSeaAccount
  feeRecipientAccount?: OpenSeaAccount
  cancelledOrFinalized?: boolean
  markedInvalid?: boolean
  asset?: OpenSeaAsset
  assetBundle?: OpenSeaAssetBundle
}

export interface OrderJSON {
  exchange: string
  maker: string
  taker: string
  makerRelayerFee: string
  takerRelayerFee: string
  makerProtocolFee: string
  takerProtocolFee: string
  feeRecipient: string
  feeMethod: FeeMethod
  side: OrderSide
  saleKind: SaleKind
  target: string
  howToCall: HowToCall
  calldata: string
  replacementPattern: string
  staticTarget: string
  staticExtradata: string
  paymentToken: string
  basePrice: string
  extra: string
  listingTime: number | string
  expirationTime: number | string
  salt: string

  metadata: {
    asset: WyvernAsset;
    schema: WyvernSchemaName;
  }

  hash: string

  // In future, make signature required
  v?: number
  r?: string
  s?: string

  /**
   * Attrs used by orderbook to make queries easier
   * Includes `maker`, `taker` and `side` from above
   */
  owner?: string,
  sale_kind?: SaleKind,
  asset_contract_address?: string,
  bundled?: boolean
  token_id?: number | string
  token_ids?: Array<number | string>
  // This means listing_time > value in seconds
  listed_after?: number | string
  // This means listing_time <= value in seconds
  listed_before?: number | string
  limit?: number
  offset?: number
}

// IN PROGRESS
export interface OpenSeaAssetJSON {
  // For querying
  owner?: string
  asset_contract_address?: string
  token_ids?: Array<number | string>
  search?: string
  order_by?: string
  order_direction?: string
  limit?: number
  offset?: number
}

export interface OrderbookResponse {
  orders: OrderJSON[]
  count: number
}

// Types related to Web3
export type Web3Callback<T> = (err: Error | null, result: T) => void
export type Web3RPCCallback = Web3Callback<Web3.JSONRPCResponsePayload>
export type TxnCallback = (result: boolean) => void

/**
 * To simplify typifying ABIs
 */
export interface PartialAbiDefinition {
  type: Web3.AbiType | string // Not Partial!
  name?: string
  inputs?: object[]
  outputs?: object[]
  payable?: boolean
  constant?: boolean
  anonymous?: boolean
  stateMutability?: Web3.ConstructorStateMutability | string
}
export type PartialReadonlyContractAbi = Array<Readonly<PartialAbiDefinition>>
