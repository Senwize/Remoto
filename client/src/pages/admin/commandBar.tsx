import { h } from 'preact';
import { useStore } from '../../services/store';

const colors = {
  red: ['bg-red-500 hover:bg-red-700 text-white', 'ring-1 ring-red-500 cursor-not-allowed text-gray-500'],
  blue: ['bg-blue-500 hover:bg-blue-700 text-white', 'ring-1 ring-blue-500 cursor-not-allowed text-gray-500'],
  green: ['bg-green-500 hover:bg-green-700 text-white', 'ring-1 ring-green-500 cursor-not-allowed text-gray-500'],
};
type BaseColor = keyof typeof colors;

console.log(colors);

interface ButtonProps {
  baseColor: BaseColor;
  disabled: boolean;
  onClick?: () => void;
  value: string;
}
const Button = ({ value, baseColor, disabled = false, onClick }: ButtonProps) => {
  return (
    <button className={`${colors[baseColor][disabled ? 1 : 0]} p-1 text-sm rounded`} onClick={onClick}>
      {value}
    </button>
  );
};

export const CommandBar = () => {
  const destroySession = useStore((state) => state.destroySession);
  const assignSandbox = useStore((state) => state.assignSandbox);

  const session = useStore((state) => state.selectedSession);
  const sandbox = useStore((state) => state.selectedSandbox);

  return (
    <div className='flex gap-2'>
      <Button
        value='Destroy session'
        baseColor='red'
        disabled={session === null}
        onClick={() => session && destroySession(session.id)}
      />
      <Button
        value='Set sandbox to session'
        baseColor='green'
        disabled={session === null || sandbox === null}
        onClick={() => session && sandbox && assignSandbox(session.id, sandbox.ip)}
      />
    </div>
  );
};
