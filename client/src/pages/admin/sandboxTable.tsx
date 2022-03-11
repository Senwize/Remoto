import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Sandbox, useStore } from '../../services/store';

const compareSandbox = (a: Sandbox, b: Sandbox) => {
  return a.ip.localeCompare(b.ip);
};

interface EntryProps {
  sandbox: Sandbox;
  selected: boolean;
  onClick?: () => void;
}
const Entry = ({ sandbox, selected, onClick }: EntryProps) => {
  const { ip, sessionID } = sandbox;

  return (
    <div
      className={`grid grid-cols-1 p-2 cursor-pointer ${selected ? 'bg-blue-200' : 'hover:bg-gray-100'}`}
      onClick={() => onClick && onClick()}
    >
      <span className='text-xl font-light'>{ip}</span>
      <span className='text-sm'>{sessionID}</span>
    </div>
  );
};

export const SandboxTable = () => {
  const sandboxes = useStore((state) => state.adminSummary?.sandboxes);
  const [selectedSandbox, setSelectedSsandbox] = useState<Sandbox | null>(null);

  return (
    <div className='flex flex-col w-full'>
      {sandboxes?.sort(compareSandbox).map((sandbox) => (
        <Entry
          sandbox={sandbox}
          selected={sandbox.ip === selectedSandbox?.ip}
          onClick={() => setSelectedSsandbox(sandbox)}
        />
      ))}
    </div>
  );
};
