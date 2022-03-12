import { h, Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { Session, useStore } from '../../services/store';

const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const compareSession = (a: Session, b: Session) => {
  return a.groupName.localeCompare(b.groupName);
};

const fmtLastActive = (secondsAgo?: number) => {
  if (secondsAgo === undefined) {
    return 'unknown';
  }

  if (secondsAgo < 5) {
    return 'just now';
  }
  if (secondsAgo < 60) {
    return fmt.format(-secondsAgo, 'seconds');
  }
  if (secondsAgo < 3600) {
    return fmt.format(-Math.round(secondsAgo / 60), 'minutes');
  }
  if (secondsAgo < 86400) {
    return fmt.format(-Math.round(secondsAgo / 3600), 'hours');
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

  const secondsAgo = Math.abs(Math.floor(lastActive - Date.now() / 1000));

  return (
    <div
      className={`grid grid-cols-2 gap-x-2 p-2 cursor-pointer ${selected ? 'bg-green-200' : 'hover:bg-gray-100'}`}
      onClick={() => onClick && onClick()}
    >
      <span className='text-xl font-light'>{groupName}</span>
      <span></span>
      <span className='text-sm'>{sandboxIP || 'No Sandbox'}</span>
      <span className={`text-right text-sm ${secondsAgo > 60 ? 'text-red-600' : ''}`}>
        Last seen {fmtLastActive(secondsAgo)}
      </span>
    </div>
  );
};

export const SessionsTable = () => {
  const sessions = useStore((state) => state.adminSummary?.sessions);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  function onEntryClick(sandbox: Session) {
    if (selectedSession === sandbox) {
      setSelectedSession(null);
      return;
    }
    setSelectedSession(sandbox);
  }

  return (
    <div className='flex flex-col w-full'>
      {sessions?.sort(compareSession).map((session) => (
        <Entry session={session} selected={session.id === selectedSession?.id} onClick={() => onEntryClick(session)} />
      ))}
    </div>
  );
};
