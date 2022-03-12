import { SessionsTable } from './sessionsTable';
import { h, Fragment } from 'preact';
import { useEffect } from 'preact/hooks';
import { useStore } from '../../services/store';
import { SandboxTable } from './sandboxTable';
import { CommandBar } from './commandBar';

export const AdminPage = () => {
  const fetchAdminSummary = useStore((state) => state.fetchAdminSummary);

  useEffect(() => {
    fetchAdminSummary();
    const intervalID = setInterval(() => fetchAdminSummary(), 3000);

    // Cleanup
    return () => {
      clearInterval(intervalID);
    };
  }, []);

  return (
    <>
      {/* Bar */}
      <div className='flex w-full border-b p-2'>
        <h1 className='font-bold text-gray-700'>Admin</h1>
      </div>

      <div className='flex flex-col gap-12 xl:m-12'>
        {/* Commandbar */}
        <div className='flex w-full border-b p-2'>
          <CommandBar />
        </div>

        {/* Body */}
        <div className='flex flex-row flex-grow gap-4 w-full'>
          <div className='w-1/3 min-h-[16rem]'>
            <h2 className='text-xl border-b'>User sessions</h2>
            <SessionsTable />
          </div>

          <div className='w-1/3 min-h-[16rem]'>
            <h2 className='text-xl border-b'>Sandboxes</h2>
            <SandboxTable />
          </div>

          <div className='w-1/3 min-h-[16rem]'>
            <h2 className='text-xl border-b'>Diagnostics</h2>
          </div>
        </div>
      </div>
    </>
  );
};
