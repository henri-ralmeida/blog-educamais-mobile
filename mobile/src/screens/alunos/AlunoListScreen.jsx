// Listagem paginada real de alunos, com paginação no servidor.
// Mesma tela compartilhada usada por professores, sem a proteção de conta
// própria: aluno não tem credencial nem sessão.
import CrudListScreen from '../shared/CrudListScreen';
import { alunosService } from '../../services/alunosService';

export default function AlunoListScreen({ navigation }) {
  return (
    <CrudListScreen
      navigation={navigation}
      service={alunosService}
      formRoute="AlunoForm"
      singular="aluno"
      plural="alunos"
      criarLabel="Novo aluno"
      emptyIcon="school-outline"
      emptyHeading="Nenhum aluno cadastrado"
      emptyBody="Cadastre o primeiro aluno para começar."
    />
  );
}
