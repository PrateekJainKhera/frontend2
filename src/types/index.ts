export interface Book {
  id: number;
  title: string;
}

export interface OrderItem {
  bookId: number;
  bookTitle: string;
  quantity: number;
}

export interface ConsignmentItem {
  id?: number;
  bookId?: number;
  bookTitle: string;
  bookSubject: string;
  bookClassLevel: string;
  quantity: number;
  unitPrice?: number;
}

export interface Consignment {
  id: number;
  transportCompanyName: string;
  biltyNumber: string;
  assignedTo?: string;
  status: number;
  dispatchDate: string;
  receivedDate?: string | null;
  freightCost?: number | null;
  biltyBillUrl?: string | null;
  items?: ConsignmentItem[];
}
