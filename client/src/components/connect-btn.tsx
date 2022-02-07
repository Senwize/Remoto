import { h } from 'preact';
import { useState } from 'preact/hooks';

export enum State {
  Disconnected,
  Connecting,
  Ready,
}

interface Props {
  state: State;
  text?: string;
  onClick?: (e: Event) => void;
}

export const ConnectButton = ({ state, text, onClick }: Props) => {
  switch (state) {
    case State.Disconnected:
      return (
        <div
          className='absolute left-1/2 -translate-x-1/2 flex justify-center items-center px-6 py-3 rounded-b-md bg-green-500 hover:bg-green-600 text-white font-bold cursor-pointer'
          onClick={onClick}
        >
          {text || 'Connect'}
        </div>
      );

    case State.Connecting:
      return (
        <div className='absolute left-1/2 -translate-x-1/2 justify-center items-center px-6 py-3 rounded-b-md bg-blue-500 text-white font-bold'>
          Connecting...
        </div>
      );
    default:
      return null;
  }
};
