import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { IEmployee } from '@/types';

export const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  const [formData, setFormData] = useState<Omit<IEmployee, 'id' | 'createdAt'>>({
    displayName: '',
    email: '',
    isAdmin: false,
    position: '',
    department: '',
    phone: '',
  });
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingEmployee, setFetchingEmployee] = useState(isEditing);
  
  useEffect(() => {
    const fetchEmployee = async () => {
      if (id) {
        try {
          const employeeDoc = await getDoc(doc(db, 'users', id));
          
          if (employeeDoc.exists()) {
            const data = employeeDoc.data() as IEmployee;
            
            setFormData({
              displayName: data.displayName,
              email: data.email,
              isAdmin: data.isAdmin,
              position: data.position || '',
              department: data.department || '',
              phone: data.phone || '',
            });
          } else {
            setError('Funcionário não encontrado');
          }
        } catch (error) {
          console.error('Erro ao buscar funcionário:', error);
          setError('Erro ao buscar funcionário');
        } finally {
          setFetchingEmployee(false);
        }
      }
    };
    
    if (isEditing) {
      fetchEmployee();
    }
  }, [id, isEditing]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isEditing) {
        // Atualizar funcionário existente
        await updateDoc(doc(db, 'users', id!), {
          ...formData,
        });
        
        navigate('/admin/employees');
      } else {
        // Criar novo funcionário
        if (!password) {
          setError('Por favor, defina uma senha');
          setLoading(false);
          return;
        }
        
        // Criar autenticação para o novo usuário
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          password
        );
        
        // Adicionar ao Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          ...formData,
          id: userCredential.user.uid,
          createdAt: Timestamp.now(),
        });
        
        navigate('/admin/employees');
      }
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
      setError(error.message || 'Erro ao salvar funcionário');
    } finally {
      setLoading(false);
    }
  };
  
  if (fetchingEmployee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-b-2 border-amber-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          asChild
          variant="ghost"
          className='!text-amber-700 hover:!text-amber-700/95'
        >
          <Link to="/admin/employees">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
        </h1>
      </div>
      
      {error && (
        <div className="p-4 text-sm text-white bg-red-500 rounded-md">
          {error}
        </div>
      )}
      
      <form 
        className="bg-white p-6 rounded-lg shadow"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label 
              className="block mb-2 text-sm font-medium text-gray-700"
              htmlFor="displayName"
            >
              Nome Completo*
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
              id="displayName"
              name="displayName"
              onChange={handleChange}
              placeholder="Nome do funcionário"
              required
              type="text"
              value={formData.displayName}
            />
          </div>
          
          <div>
            <label 
              className="block mb-2 text-sm font-medium text-gray-700"
              htmlFor="email"
            >
              Email*
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
              disabled={isEditing}
              id="email"
              name="email"
              onChange={handleChange}
              placeholder="email@example.com"
              required
              type="email"
              value={formData.email}
            />
            {isEditing && (
              <p className="mt-1 text-xs text-gray-500">
                O email não pode ser alterado após a criação.
              </p>
            )}
          </div>
          
          {!isEditing && (
            <div>
              <label 
                className="block mb-2 text-sm font-medium text-gray-700"
                htmlFor="password"
              >
                Senha Inicial*
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
                id="password"
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                required
                type="password"
                value={password}
              />
            </div>
          )}
          
          <div>
            <label 
              className="block mb-2 text-sm font-medium text-gray-700"
              htmlFor="phone"
            >
              Telefone
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
              id="phone"
              name="phone"
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              type="tel"
              value={formData.phone}
            />
          </div>
          
          <div>
            <label 
              className="block mb-2 text-sm font-medium text-gray-700"
              htmlFor="position"
            >
              Cargo
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
              id="position"
              name="position"
              onChange={handleChange}
              placeholder="Ex: Analista, Técnico"
              type="text"
              value={formData.position}
            />
          </div>
          
          <div>
            <label 
              className="block mb-2 text-sm font-medium text-gray-700"
              htmlFor="department"
            >
              Departamento
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
              id="department"
              name="department"
              onChange={handleChange}
              placeholder="Ex: TI, Financeiro"
              type="text"
              value={formData.department}
            />
          </div>
        </div>
        
        <div className="flex items-center mt-6 space-x-4">
          <Button
            asChild
            type="button"
            variant="outline"
            className='!text-amber-700 hover:!text-amber-700/95'
          >
            <Link to="/admin/employees">
              Cancelar
            </Link>
          </Button>
          
          <Button
            disabled={loading}
            type="submit"
            className='!bg-amber-700 !text-white hover:!bg-amber-700/95'
          >
            {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Funcionário'}
          </Button>
        </div>
      </form>
    </div>
  );
}; 