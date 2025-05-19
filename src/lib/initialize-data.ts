import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/config/firebase';
import { TaskStatus } from '@/types';

const ADMIN_EMAIL = 'admin@sonatto.com';
const ADMIN_PASSWORD = 'sonato123456';

/**
 * Inicializa os dados padrão da aplicação
 */
export const initializeAppData = async (): Promise<void> => {
  try {
    console.log('Verificando dados iniciais da aplicação...');
    
    // Verificar se o admin já existe
    const adminExists = await checkAdminExists();
    
    let adminId = '';
    if (!adminExists) {
      console.log('Criando usuário administrador...');
      adminId = await createAdminUser();
    } else {
      console.log('Usuário administrador já existe.');
      // Buscar ID do administrador existente
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', ADMIN_EMAIL));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        adminId = querySnapshot.docs[0].id;
      }
    }
    
    // Verificar e criar coleções e documentos iniciais
    await createInitialCollections(adminId);
    
    console.log('Inicialização de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar dados da aplicação:', error);
  }
};

/**
 * Verifica se o usuário admin já existe
 */
const checkAdminExists = async (): Promise<boolean> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', ADMIN_EMAIL), where('isAdmin', '==', true));
  const querySnapshot = await getDocs(q);
  
  return !querySnapshot.empty;
};

/**
 * Cria o usuário administrador
 */
const createAdminUser = async (): Promise<string> => {
  try {
    // Tentar criar o usuário na autenticação
    let userCredential;
    
    try {
      userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    } catch (error: any) {
      // Se o usuário já existe na autenticação, mas não no Firestore, fazer login
      if (error.code === 'auth/email-already-in-use') {
        userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      } else {
        throw error;
      }
    }
    
    // Criar documento do usuário no Firestore
    const userId = userCredential.user.uid;
    const userRef = doc(db, 'users', userId);
    
    // Verificar se já existe no Firestore
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        id: userId,
        email: ADMIN_EMAIL,
        displayName: 'Administrador',
        isAdmin: true,
        createdAt: Timestamp.now(),
      });
      
      console.log(`Usuário administrador criado com sucesso! ID: ${userId}`);
    } else {
      // Garantir que o usuário existente é administrador
      await setDoc(userRef, { isAdmin: true }, { merge: true });
      console.log(`Usuário ${ADMIN_EMAIL} promovido a administrador!`);
    }
    
    return userId;
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    throw error;
  }
};

/**
 * Cria as coleções e documentos iniciais
 */
const createInitialCollections = async (adminId: string): Promise<void> => {
  try {
    // Verificar se já existem dados
    const tasksRef = collection(db, 'tasks');
    const tasksSnapshot = await getDocs(tasksRef);
    
    if (!tasksSnapshot.empty) {
      console.log('Já existem dados na coleção de tarefas.');
      return;
    }
    
    console.log('Criando coleções e dados iniciais...');
    
    // Criar algumas tarefas de exemplo em lote
    const batch = writeBatch(db);
    
    // Tarefa de exemplo 1
    const task1Ref = doc(collection(db, 'tasks'));
    batch.set(task1Ref, {
      id: task1Ref.id,
      title: 'Configurar ambiente de desenvolvimento',
      description: 'Instalar e configurar as ferramentas necessárias para o ambiente de desenvolvimento.',
      status: TaskStatus.COMPLETED,
      assignedTo: adminId, // Atribuída ao administrador
      assignedBy: adminId, // Atribuída pelo administrador
      dueDate: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // Amanhã
      createdAt: Timestamp.now(),
      completedAt: Timestamp.now()
    });
    
    // Tarefa de exemplo 2
    const task2Ref = doc(collection(db, 'tasks'));
    batch.set(task2Ref, {
      id: task2Ref.id,
      title: 'Atualizar documentação do projeto',
      description: 'Revisar e atualizar a documentação do projeto com as últimas alterações.',
      status: TaskStatus.PENDING,
      assignedTo: adminId, // Atribuída ao administrador
      assignedBy: adminId, // Atribuída pelo administrador
      dueDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 dias
      createdAt: Timestamp.now()
    });
    
    // Tarefa de exemplo 3
    const task3Ref = doc(collection(db, 'tasks'));
    batch.set(task3Ref, {
      id: task3Ref.id,
      title: 'Implementar nova funcionalidade',
      description: 'Desenvolver e testar a nova funcionalidade de exportação de relatórios.',
      status: TaskStatus.IN_PROGRESS,
      assignedTo: adminId, // Atribuída ao administrador
      assignedBy: adminId, // Atribuída pelo administrador
      dueDate: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 dias
      createdAt: Timestamp.now(),
      startedAt: Timestamp.now()
    });
    
    // Executar o lote
    await batch.commit();
    
    console.log('Dados iniciais criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar coleções iniciais:', error);
    throw error;
  }
}; 