import type { MenuItem } from "../shared/types";

export const menuItems: MenuItem[] = [
  {
    id: "margherita-pizza",
    name: "Margherita Pizza",
    description: "Tomato sauce, fresh mozzarella, basil, and olive oil.",
    price: 12.5,
    image:
      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "classic-burger",
    name: "Classic Burger",
    description: "Beef patty, cheddar, lettuce, tomato, and house sauce.",
    price: 10.75,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "veggie-bowl",
    name: "Veggie Bowl",
    description: "Brown rice, roasted vegetables, avocado, and tahini dressing.",
    price: 11.25,
    image:
      "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "spicy-noodles",
    name: "Spicy Noodles",
    description: "Stir-fried noodles with vegetables, chili oil, and sesame.",
    price: 9.9,
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"
  }
];

export function findMenuItem(id: string) {
  return menuItems.find((item) => item.id === id);
}
