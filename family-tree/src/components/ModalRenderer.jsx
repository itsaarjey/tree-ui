import { useFamilyTree } from '../FamilyTreeContext';
import AddMemberModal from './AddMemberModal';
import EditMemberModal from './EditMemberModal';
import AddSpouseModal from './AddSpouseModal';
import AddChildModal from './AddChildModal';

export default function ModalRenderer() {
  const { modal } = useFamilyTree();
  if (!modal) return null;

  const { type, props } = modal;

  if (type === 'addMember') return <AddMemberModal {...props} />;
  if (type === 'editMember') return <EditMemberModal {...props} />;
  if (type === 'addSpouse') return <AddSpouseModal {...props} />;
  if (type === 'addChild') return <AddChildModal {...props} />;

  return null;
}
