import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 text-center bg-white rounded-lg shadow-md">
        <h1 className="mb-4 text-6xl font-bold text-red-500">
          404
        </h1>
        <h2 className="mb-6 text-2xl font-semibold">
          Página não encontrada
        </h2>
        <p className="mb-8 text-gray-600">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button 
          asChild
          variant="default"
        >
          <Link to="/">
            Voltar para a página principal
          </Link>
        </Button>
      </div>
    </div>
  );
}; 