import { ShoppingBag } from 'lucide-react';
import CatalogSection from '../../components/CatalogSection';
import './ClientStorePage.css';

export default function ClientStorePage() {
    return (
        <main className="store-page animate-fadeIn">
            <div className="store-page-header">
                <h1>
                    <ShoppingBag size={28} className="text-primary" />
                    Tienda
                </h1>
                <p>Explora nuestro catálogo de servicios y productos. Agrega al carrito y realiza tu pedido.</p>
            </div>
            <CatalogSection embedded={true} showCartButton={true} />
        </main>
    );
}
