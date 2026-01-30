import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import GlobalLayout from './components/GlobalLayout';
import ModulesPage from './pages/ModulesPage';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <GlobalLayout>
                                <Layout />
                            </GlobalLayout>
                        </ProtectedRoute>
                    }>
                        <Route path="/" element={<ModulesPage />} />
                        <Route path="/course/:courseId" element={<ModulesPage />} />
                    </Route>



                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <GlobalLayout>
                                <ProfilePage />
                            </GlobalLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <GlobalLayout>
                                <Dashboard />
                            </GlobalLayout>
                        </ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
