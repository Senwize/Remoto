import { createRef, h } from 'preact';
import { useState } from 'preact/hooks';
import { useSession } from '../services/session';

const PREVIOUS_WORKSHOPCODE = 'prev_workshop_code';

export default function LoginPage() {
  const errorTimeout = createRef();
  const [error, setError] = useState<string | null>(null);
  const [workshopCode, setWorkshopCode] = useState(localStorage.getItem(PREVIOUS_WORKSHOPCODE) ?? '');
  const startSession = useSession((state) => state.startSession);

  function displayError(err: Error) {
    if (errorTimeout.current) {
      clearTimeout(errorTimeout.current);
    }

    setError(err.message);

    errorTimeout.current = setTimeout(() => {
      errorTimeout.current = null;
      setError(null);
    }, 3000);
  }

  function handleSubmit(e: any) {
    e.preventDefault();

    startSession(workshopCode)
      .then(() => {
        localStorage.setItem(PREVIOUS_WORKSHOPCODE, workshopCode);
      })
      .catch((err) => {
        displayError(err);
      });
  }

  return (
    <div className='w-96 mt-12 p-3 mx-auto border rounded-md shadow-xl'>
      <h1 className='text-xl text-center mb-4'>Login</h1>
      <form onSubmit={handleSubmit} autocomplete='off'>
        <fieldset className='py-2'>
          <label className='text-gray-700' for='workshopcode'>
            Workshop Code
          </label>
          <p className='text-gray-500 text-sm'>Enter the workshop code given by your instructor</p>
          <input
            className='w-full p-2 border focus:outline-none'
            type='text'
            placeholder='ABCDEFG'
            value={workshopCode}
            onChange={(e: any) => setWorkshopCode(e.target.value)}
            id='workshopcode'
          />
        </fieldset>
        <input
          className='w-full mt-2 py-2 bg-blue-500 hover:bg-blue-600 text-white text-center font-bold cursor-pointer'
          type='submit'
          value='Login'
        />
        <fieldset className='mt-2'>
          <p className='text-sm transition text-red-500'>{error}</p>
        </fieldset>
      </form>
    </div>
  );
}
