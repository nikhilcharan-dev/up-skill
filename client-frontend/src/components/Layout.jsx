import { Outlet } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout-container">
            <main className="main-content">
                <div className="content-scroll">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
