import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/contexts/AuthContext';
import { PrivateRoute } from '@/components/common/PrivateRoute';
import { StatusPage } from '@/pages/StatusPage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MonitorDetailPage } from '@/pages/MonitorDetailPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 30_000 },
    },
});

export const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <BrowserRouter>
                <div className='ambient' />
                <div className='gridNoise' />
                <div className='appContent'>
                    <Routes>
                        <Route path='/status' element={<StatusPage />} />
                        <Route path='/login' element={<LoginPage />} />
                        <Route element={<PrivateRoute />}>
                            <Route path='/' element={<DashboardPage />} />
                            <Route path='/monitors/:id' element={<MonitorDetailPage />} />
                        </Route>
                        <Route path='*' element={<Navigate to='/' replace />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    </QueryClientProvider>
);
