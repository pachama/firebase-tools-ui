/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  act,
  fireEvent,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import React from 'react';

import { delay } from '../../../test_utils';
import { renderDialogWithFirestore } from '../../Firestore/testing/test_utils';
import { fakeReference } from '../testing/models';
import { CloneDialog } from './CloneDialog';

const setup = async () => {
  const onComplete = jest.fn();
  const parent = fakeReference({ key: 'parent', path: 'parent' });
  const ROOT_REF = fakeReference({ key: null, parent: null });
  const ref = fakeReference({
    parent,
    key: 'to_clone',
    path: 'parent/to_clone',
    data: { bool: true, number: 1234, string: 'a string', json: { a: 'b' } },
  });
  (ROOT_REF.child as jest.Mock).mockReturnValue(ref);
  ref.root = ROOT_REF;
  (ref.child as jest.Mock).mockReturnValue(ref);

  const { getByText, getByLabelText, getByTestId } =
    await renderDialogWithFirestore(async (firestore) => (
      <CloneDialog onComplete={onComplete} realtimeRef={ref} />
    ));
  await waitForElementToBeRemoved(() => getByText(/Loading/));
  return { ref, onComplete, getByLabelText, getByText, getByTestId };
};

it('uses a filtered data set when query params are provided', async () => {
  const rootRef = fakeReference({
    parent: null,
    key: null,
    path: '/',
    data: {},
  });

  const todosRef = fakeReference({
    parent: rootRef,
    key: 'todos',
    path: '/todos',
    data: {
      one: { title: 'Not done', completed: false },
      two: { title: 'Totally done', completed: true },
    },
  });

  const todosQuery = fakeReference({
    parent: rootRef,
    key: 'todos',
    path: '/todos',
    data: {
      one: { title: 'Not done', completed: false },
    },
  });

  const { getByLabelText } = await renderDialogWithFirestore(async () => (
    <CloneDialog
      onComplete={jest.fn()}
      realtimeRef={todosRef}
      query={todosQuery}
    />
  ));

  await waitFor(() => getByLabelText(/one:/));

  expect(() => getByLabelText(/two:/)).toThrowError();
  expect(getByLabelText(/one:/)).toBeDefined();
});

describe('errors', () => {
  const errorHandler = (event: ErrorEvent) => {
    event.preventDefault();
  };

  beforeAll(() => window.addEventListener('error', errorHandler));
  afterAll(() => window.removeEventListener('error', errorHandler));

  class ErrorBoundary extends React.Component {
    state: any = { hasError: true, error: null };
    static getDerivedStateFromError(error: any) {
      return {
        hasError: true,
        error,
      };
    }
    render() {
      if (this.state.hasError) {
        return <div>CAUGHT_ERROR</div>;
      } else {
        return <div></div>;
      }
    }
  }

  it('fails when trying to clone the root', async () => {
    const rootRef = fakeReference({
      parent: null,
      key: null,
      path: '/',
      data: {},
    });

    const { getByText } = render(
      <ErrorBoundary>
        <CloneDialog onComplete={jest.fn()} realtimeRef={rootRef} />
      </ErrorBoundary>
    );

    expect(getByText('CAUGHT_ERROR')).not.toBeNull();
  });
});

it('shows a title with the key to clone', async () => {
  const { getByText } = await setup();

  expect(getByText(/Clone "to_clone"/)).not.toBeNull();
});

it('defaults the new destination path to /parent/<key>_copy', async () => {
  const { getByLabelText } = await setup();

  expect(
    (getByLabelText('New destination path:') as HTMLInputElement).value
  ).toBe('/parent/to_clone_copy');
});

it('contains an input and json value for each field', async () => {
  const { getByLabelText } = await setup();

  expect((getByLabelText(/bool:/) as HTMLInputElement).value).toBe('true');
  expect((getByLabelText(/number:/) as HTMLInputElement).value).toBe('1234');
  expect((getByLabelText(/string:/) as HTMLInputElement).value).toBe(
    '"a string"'
  );
  expect((getByLabelText(/json:/) as HTMLInputElement).value).toBe('{"a":"b"}');
});

it('clones dialog data when the dialog is accepted', async () => {
  const { ref, getByText, getByLabelText } = await setup();

  fireEvent.change(getByLabelText('string:'), {
    target: {
      value: '"new string"',
    },
  });

  fireEvent.change(getByLabelText('number:'), {
    target: {
      value: '12',
    },
  });

  fireEvent.change(getByLabelText('json:'), {
    target: {
      value: '{"x": "y"}',
    },
  });

  await act(async () => {
    fireEvent.submit(getByText('Clone'));
    await delay(100); // Wait for the dialog DOM changes to settle.
  });

  expect(ref.root.child).toHaveBeenCalledWith('/parent/to_clone_copy');
  expect(ref.set).toHaveBeenCalledWith({
    bool: true,
    number: 12,
    string: 'new string',
    json: {
      x: 'y',
    },
  });
});

it('calls onComplete with new key value when accepted', async () => {
  const { getByText, onComplete } = await setup();

  fireEvent.submit(getByText('Clone'));

  expect(onComplete).toHaveBeenCalledWith('/parent/to_clone_copy');
});

it('does not set data when the dialog is cancelled', async () => {
  const { ref, getByText } = await setup();

  act(() => {
    getByText('Cancel').click();
  });

  expect(ref.set).not.toHaveBeenCalled();
});

it('calls onComplete with undefined when cancelled', async () => {
  const { getByText, onComplete } = await setup();

  act(() => getByText('Cancel').click());

  expect(onComplete).toHaveBeenCalledWith();
});
