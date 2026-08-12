export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type OrderStatus =
  | "Order Received"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type OrderLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

export type DeliveryDetails = {
  name: string;
  address: string;
  phone: string;
};

export type Order = {
  id: string;
  items: OrderLine[];
  delivery: DeliveryDetails;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  item: MenuItem;
  quantity: number;
};

export type CreateOrderInput = {
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  delivery: DeliveryDetails;
};
