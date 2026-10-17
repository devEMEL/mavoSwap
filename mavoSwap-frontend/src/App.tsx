import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SwapPage from '@/app/page';
import ActivityPage from '@/app/activity/page';
import ProfilePage from '@/app/profile/page';
import PoolsPage from '@/app/pools/page';
import CreatePoolPage from '@/app/pools/create/page';
import PoolDetailsPage from '@/app/pools/[id]/page';
import PositionDetailsPage from '@/app/positions/[id]/page';
import CreatePositionPage from '@/app/positions/create/[params]/page';

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-black">
          <Navbar />
          <main className="flex-1 pt-20">
            <div className="max-w-6xl mx-auto px-6 md:px-8 w-full pt-12">
            <Routes>
              <Route path="/" element={<SwapPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/pools" element={<PoolsPage />} />
              <Route path="/pools/create" element={<CreatePoolPage />} />
              <Route path="/pools/:id" element={<PoolDetailsPage />} />
              <Route path="/positions/:id" element={<PositionDetailsPage />} />
              <Route path="/positions/create/:params" element={<CreatePositionPage />} />

            </Routes>
            </div>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </Providers>
  );
}
