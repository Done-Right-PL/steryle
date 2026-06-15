import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import AccountPage from './pages/AccountPage'
import CartPage from './pages/CartPage'
import CategoriesPage from './pages/CategoriesPage'
import CategoryPage from './pages/CategoryPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ProductPage from './pages/ProductPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
