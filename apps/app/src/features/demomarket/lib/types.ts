export interface Product {
    id: string;
    title: string;
    price: number;
    image: string;
    margin: number;
    market_code: string; // e.g., 'A01'
    category: string;
}

export interface DemoMarketProvider {
    /**
     * Checks if the user has connected the Demo Market channel.
     */
    isConnected(userId: string): Promise<boolean>;

    /**
     * Connects the user to the Demo Market (simulated OAuth/Agreements).
     */
    connect(userId: string): Promise<void>;

    /**
     * Fetches a list of products (stubbed or real).
     */
    listProducts(userId: string): Promise<Product[]>;
}
