// src/app/dashboard/my-orders/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Hash } from 'lucide-react';
import api from '@/services/api';
import { useAuthContext } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext'; // ADD THIS
interface MyOrder {
  id: number;
  orderDate: string;
  bookTitle: string;
  bookSubject: string;
  bookClassLevel: string;
  quantity: number;
placedByName: string;  // <-- FIX #1: Renamed from teacherName
  locationName: string;  // <-- FIX #2: Renamed from schoolName
  locationArea: string;  // <-- FIX #3: Renamed from schoolArea
}
export default function MyOrdersPage() {
  const { user } = useAuthContext();
  const { t } = useLanguage(); // ADD THIS
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (user?.roleName === 'Executive') {
      const fetchMyOrders = async () => {
        try {
          setIsLoading(true);
          const response = await api.get('/orders/my-orders');
          setMyOrders(response.data);
        } catch (error) {
          console.error("Failed to fetch my orders:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMyOrders();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  if (isLoading) {
    return <div className="p-4">{t('ordersPage.loading')}</div>;
  }
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t('ordersPage.title')}</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl">
            <span>{t('ordersPage.history')}</span>
            <Badge className="text-base px-3 py-1">
              {myOrders.length} {t('ordersPage.totalOrders')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg">{t('ordersPage.noOrders')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-4 text-left font-semibold">{t('ordersPage.orderDate')}</th>
                    <th className="p-4 text-left font-semibold">{t('ordersPage.location')}</th>
<th className="p-4 text-left font-semibold">Ordered By</th>
                    <th className="p-4 text-left font-semibold">{t('ordersPage.bookDetails')}</th>
                    <th className="p-4 text-left font-semibold">{t('ordersPage.quantity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {myOrders.map(o => (
                    <tr key={o.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{new Date(o.orderDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-4">
                        <p className="font-medium">{o.locationName}</p>
                        <p className="text-sm text-gray-500">{o.locationArea}</p>
                      </td>
                      <td className="p-4">{o.placedByName}</td>
                      <td className="p-4">
                        <p className="font-medium">{o.bookTitle}</p>
                        <p className="text-sm text-gray-500">
                          {t('ordersPage.class')}: {o.bookClassLevel} | {t('ordersPage.subject')}: {o.bookSubject}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Hash className="h-5 w-5 text-gray-400" />
                          <span className="font-bold text-lg">{o.quantity}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}