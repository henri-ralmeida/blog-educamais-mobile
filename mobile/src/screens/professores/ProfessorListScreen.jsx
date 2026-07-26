// Listagem paginada real de professores, com paginação no servidor.
// A tela em si é a CrudListScreen compartilhada; aqui só ficam os rótulos e o
// serviço, além da proteção contra editar/excluir a própria conta.
import CrudListScreen from '../shared/CrudListScreen';
import { professoresService } from '../../services/professoresService';

export default function ProfessorListScreen({ navigation }) {
  return (
    <CrudListScreen
      navigation={navigation}
      service={professoresService}
      formRoute="ProfessorForm"
      singular="professor"
      plural="professores"
      criarLabel="Novo professor"
      emptyIcon="person-outline"
      emptyHeading="Nenhum professor cadastrado"
      emptyBody="Cadastre o primeiro professor para começar."
      protegerContaPropria
    />
  );
}
