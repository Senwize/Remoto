import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Session, useStore } from '../../services/store';
import { usePopper } from 'react-popper';

const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const compareSession = (a: Session, b: Session) => {
  return a.groupName.localeCompare(b.groupName);
};

const fmtLastActive = (lastActive?: number) => {
  if (lastActive === undefined) {
    return 'Unknown';
  }

  const relative = Math.floor(lastActive - Date.now() / 1000);
  const relativeAbs = Math.abs(relative);

  if (relativeAbs < 5) {
    return 'Just now';
  }
  if (relativeAbs < 60) {
    return fmt.format(relative, 'seconds');
  }
  if (relativeAbs < 3600) {
    return fmt.format(Math.round(relative / 60), 'minutes');
  }
  if (relativeAbs < 86400) {
    return fmt.format(Math.round(relative / 3600), 'hours');
  }
  return 'days';
};

interface EntryProps {
  session: Session;
  selected: boolean;
  onClick?: () => void;
}
const Entry = ({ session, selected, onClick }: EntryProps) => {
  const { groupName, sandboxIP, lastActive } = session;

  return (
    <div
      className={`grid grid-cols-2 gap-x-2 p-2 cursor-pointer ${selected ? 'bg-green-200' : 'hover:bg-gray-100'}`}
      onClick={() => onClick && onClick()}
    >
      <span className='text-xl font-light'>{groupName}</span>
      <span></span>
      <span className='text-sm'>{sandboxIP || 'No Sandbox'}</span>
      <span className='text-right text-sm'>Active {fmtLastActive(lastActive)}</span>
    </div>
  );
};

export const SessionsTable = () => {
  const sessions = useStore((state) => state.adminSummary?.sessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  return (
    <div className='flex flex-col w-full'>
      {sessions?.sort(compareSession).map((session) => (
        <Entry
          session={session}
          selected={session.id === selectedSession?.id}
          onClick={() => setSelectedSession(session)}
        />
      ))}
    </div>
  );
};
