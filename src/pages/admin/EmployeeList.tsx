import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Plus, Pencil, Trash2, Mail, Phone, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IEmployee } from '@/types';

export const EmployeeList = () => {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'users'), where('isAdmin', '==', false));
        const querySnapshot = await getDocs(q);
        
        const employeeList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id
          } as IEmployee;
        });
        
        setEmployees(employeeList);
      } catch (error) {
        console.error('Erro ao buscar funcionários:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        setEmployees(employees.filter(employee => employee.id !== id));
      } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-t-2 border-b-2 border-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-800">
          Funcionários
        </h1>
        <Button
          asChild
          className="flex items-center bg-amber-700 !text-white hover:bg-amber-700/95"
        >
          <Link to="/admin/employees/new">
            <Plus className="w-4 h-4 mr-2" />
            Novo Funcionário
          </Link>
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left border-b">
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo/Departamento
                </th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td 
                    className="px-6 py-10 text-center text-sm text-gray-500"
                    colSpan={4}
                  >
                    Nenhum funcionário cadastrado
                  </td>
                </tr>
              ) : (
                employees.map(employee => (
                  <tr
                    className="hover:bg-gray-50"
                    key={employee.id}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {employee.photoURL ? (
                          <img
                            alt={employee.displayName}
                            className="w-10 h-10 rounded-full mr-3"
                            src={employee.photoURL}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-amber-300 flex items-center justify-center mr-3">
                            <span className="text-amber-800 font-semibold">
                              {employee.displayName?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {employee.displayName || 'Sem nome'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-1" />
                          {employee.email}
                        </div>
                        {employee.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-1" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {employee.position || 'Não definido'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.department || 'Não definido'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Button
                          asChild
                          size="sm"
                          className='!text-zinc-700 hover:!text-zinc-700/95'
                          variant="ghost"
                        >
                          <Link to={`/admin/employees/${employee.id}`}>
                            <Pencil className="w-4 h-4 mr-1 text-zinc-800" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className='!text-zinc-700 hover:!text-zinc-700/95'
                        >
                          <Link to={`/admin/employees/${employee.id}/tasks`}>
                            <ClipboardList className="w-4 h-4 mr-1" />
                            Tarefas
                          </Link>
                        </Button>
                        <Button
                          onClick={() => handleDelete(employee.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                          <span className="text-red-500">
                            Excluir
                          </span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 