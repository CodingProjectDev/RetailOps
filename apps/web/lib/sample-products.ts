export type SampleProduct = {
  id: string;
  barcode: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
};

export const sampleProducts: SampleProduct[] = [
  { id: "p1", barcode: "049000028911", sku: "DRINK-001", name: "Coca-Cola 20oz", price: 2.49, stock: 25 },
  { id: "p2", barcode: "012000001741", sku: "DRINK-002", name: "Pepsi 20oz", price: 2.39, stock: 18 },
  { id: "p3", barcode: "611269818306", sku: "DRINK-003", name: "Red Bull 12oz", price: 3.99, stock: 12 },
  { id: "p4", barcode: "028400090896", sku: "SNACK-001", name: "Doritos Nacho", price: 2.79, stock: 20 }
];
