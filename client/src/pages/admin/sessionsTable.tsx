import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../services/store';
import '@szhsin/react-menu/dist/core.css';

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
  const [secondsAgo, setSecondsAgo] = useState<number>(Math.abs(Math.floor(lastActive - Date.now() / 1000)));

  useEffect(() => {
    const intervalID = setInterval(() => {
      setSecondsAgo(Math.abs(Math.floor(lastActive - Date.now() / 1000)));
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(intervalID);
    };
  }, [lastActive]);

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
  const selectedSession = useStore((state) => state.selectedSession);
  const selectSession = useStore((state) => state.selectSession);

  return (
    <div className='flex flex-col w-full'>
      {sessions?.sort(compareSession).map((session) => (
        <Entry
          session={session}
          selected={session.id === selectedSession?.id}
          onClick={() => (selectedSession?.id === session.id ? selectSession(null) : selectSession(session))}
        />
      ))}
    </div>
  );
};
