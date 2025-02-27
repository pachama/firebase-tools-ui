/**
 * Copyright 2021 Google LLC
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

import { all, call, getContext, put, setContext } from 'redux-saga/effects';

import AuthApi from '../../components/Auth/api';
import { AddAuthUserPayload, AuthUser } from '../../components/Auth/types';
import {
  authFetchUsersRequest,
  authFetchUsersSuccess,
  clearAuthUserDialogData,
  createUserRequest,
  createUserSuccess,
  deleteUserRequest,
  deleteUserSuccess,
  getAllowDuplicateEmailsRequest,
  nukeUsersSuccess,
  setAllowDuplicateEmailsRequest,
  setAllowDuplicateEmailsSuccess,
  setAuthUserDialogLoading,
  setUserDisabledRequest,
  setUserDisabledSuccess,
  updateAuthConfig,
  updateUserRequest,
  updateUserSuccess,
} from './actions';
import {
  AUTH_API_CONTEXT,
  configureAuthSaga,
  createUser,
  deleteUser,
  fetchAuthUsers,
  getAllowDuplicateEmails,
  initAuth,
  nukeUsers,
  setAllowDuplicateEmails,
  setUserDisabled,
  updateUser,
} from './sagas';

describe('Auth sagas', () => {
  describe('authFetchUsers', () => {
    it('dispatches authFetchUsersSuccess action with the resulting info', () => {
      const gen = fetchAuthUsers();
      const fakeAuthApi = { fetchUsers: jest.fn() };
      const fakeUsers: AuthUser[] = [];
      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });
      expect(gen.next(fakeAuthApi)).toEqual({
        done: false,
        value: call([fakeAuthApi, 'fetchUsers']),
      });
      expect(gen.next(fakeUsers)).toEqual({
        done: false,
        value: put(authFetchUsersSuccess(fakeUsers)),
      });
      expect(gen.next().done).toBe(true);
    });
  });

  describe('createUser', () => {
    it('dispatches createUserSuccess', () => {
      const user = { displayName: 'lol' } as AddAuthUserPayload;
      const fakeAuthApi = { createUser: jest.fn() };
      const gen = createUser(createUserRequest({ user }));

      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });

      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(true)),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: call([fakeAuthApi, 'createUser'], user),
      });

      expect(gen.next(user as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(createUserSuccess({ user: user as unknown as AuthUser })),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: put(clearAuthUserDialogData()),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(false)),
      });

      expect(gen.next().done).toBe(true);
    });

    it('makes a separate call to update customAttributes', () => {
      const user = {
        displayName: 'lol',
        customAttributes: '{"a": 1}',
      } as AddAuthUserPayload;
      const fakeAuthApi = {
        createUser: jest.fn(),
        updateUser: jest.fn(),
      };

      const gen = createUser(createUserRequest({ user }));

      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });

      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(true)),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: call([fakeAuthApi, 'createUser'], user),
      });

      const newUser = {
        localId: 'lol',
        displayName: user.displayName,
      } as AuthUser;

      expect(gen.next(newUser as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: call([fakeAuthApi, 'updateUser'], {
          localId: newUser.localId,
          customAttributes: user.customAttributes,
        }),
      });

      newUser.customAttributes = user.customAttributes;

      expect(gen.next(newUser as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(createUserSuccess({ user: newUser })),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: put(clearAuthUserDialogData()),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(false)),
      });

      expect(gen.next().done).toBe(true);
    });

    it('handles errors', () => {
      const user = { displayName: 'lol' } as AddAuthUserPayload;
      const errorMessage = 'ops';
      const fakeAuthApi = {
        createUser: jest.fn(),
      };

      const gen = createUser(createUserRequest({ user }));

      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });

      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(true)),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: call([fakeAuthApi, 'createUser'], user),
      });

      gen.throw(new Error(errorMessage));

      expect(gen.next()).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(false)),
      });

      expect(gen.next().done).toBe(true);
    });

    it('does not close the dialog', () => {
      const user = { displayName: 'lol' } as AddAuthUserPayload;
      const errorMessage = 'ops';
      const fakeAuthApi = {
        createUser: jest.fn(),
      };

      const gen = createUser(createUserRequest({ user, keepDialogOpen: true }));

      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });

      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(true)),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: call([fakeAuthApi, 'createUser'], user),
      });

      gen.throw(new Error(errorMessage));

      expect(gen.next()).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(false)),
      });

      expect(gen.next().done).toBe(true);
    });
  });

  describe('initAuth', () => {
    it('does nothing if auth is disabled', () => {
      const gen = initAuth(updateAuthConfig(null));

      expect(gen.next({})).toEqual({
        done: true,
      });
    });

    it('dispatches appropriate actions if auth is enabled', () => {
      const gen = initAuth(
        updateAuthConfig({
          auth: {
            hostAndPort: 'localhost:9099',
            host: 'localhost',
            port: 9099,
            useHttps: false
          },
          projectId: 'hello',
        })
      );
      expect(gen.next()).toEqual({
        done: false,
        value: setContext(expect.anything()),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: all(
          expect.arrayContaining([
            put(authFetchUsersRequest()),
            put(getAllowDuplicateEmailsRequest()),
          ])
        ),
      });

      expect(gen.next()).toEqual({
        done: true,
      });
    });
  });

  describe('deleteUser', () => {
    it('dispatches deleteUserSuccess action with the resulting info', () => {
      const localId = 'pirojok';
      const fakeAuthApi = { deleteUser: jest.fn() };
      const payload = { localId };
      const gen = deleteUser(deleteUserRequest(payload));
      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });
      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: call([fakeAuthApi, 'deleteUser'], payload),
      });
      expect(gen.next(payload as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(deleteUserSuccess(payload)),
      });

      expect(gen.next().done).toBe(true);
    });
  });

  describe('updateUser', () => {
    it('dispatches updateUserSuccess action with the resulting info', () => {
      const localId = 'pirojok';
      const user = { displayName: 'lol' } as AddAuthUserPayload;
      const fakeAuthApi = { updateUser: jest.fn() };
      const newUser = { ...user, localId };
      const gen = updateUser(updateUserRequest({ user, localId }));

      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });

      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(true)),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: call([fakeAuthApi, 'updateUser'], newUser),
      });
      expect(gen.next(newUser as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(updateUserSuccess({ user: newUser as AuthUser })),
      });

      expect(gen.next()).toEqual({
        done: false,
        value: put(clearAuthUserDialogData()),
      });

      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: put(setAuthUserDialogLoading(false)),
      });

      expect(gen.next().done).toBe(true);
    });
  });

  describe('setUserDisabled', () => {
    it('dispatches updateUserSuccess action with the resulting info', () => {
      const localId = 'pirojok';
      const fakeAuthApi = { updateUser: jest.fn() };
      const isDisabled = true;
      const payload = { disabled: isDisabled, localId };
      const gen = setUserDisabled(setUserDisabledRequest(payload));

      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });
      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: call([fakeAuthApi, 'updateUser'], {
          disableUser: isDisabled,
          localId,
        }),
      });
      expect(gen.next()).toEqual({
        done: false,
        value: put(setUserDisabledSuccess(payload)),
      });

      expect(gen.next().done).toBe(true);
    });
  });

  describe('nukeUsers', () => {
    it('dispatches nukeUsersSuccess action', () => {
      const gen = nukeUsers();
      const fakeAuthApi = { nukeUsers: jest.fn() };

      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });
      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: call([fakeAuthApi, 'nukeUsers']),
      });
      expect(gen.next()).toEqual({
        done: false,
        value: put(nukeUsersSuccess()),
      });

      expect(gen.next().done).toBe(true);
    });
  });

  describe('setAllowDuplicateEmails', () => {
    it('triggers appropriate API endpoint', () => {
      const fakeAuthApi = { updateConfig: jest.fn() };
      const gen = setAllowDuplicateEmails(setAllowDuplicateEmailsRequest(true));
      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });
      expect(gen.next(fakeAuthApi as unknown as AuthApi & AuthUser)).toEqual({
        done: false,
        value: call([fakeAuthApi, 'updateConfig'], true),
      });
      expect(gen.next()).toEqual({
        done: false,
        value: put(setAllowDuplicateEmailsSuccess(true)),
      });
    });
  });

  describe('getAllowDuplicateEmails', () => {
    it('triggers appropriate API endpoint', () => {
      const fakeAuthApi = { getConfig: jest.fn() };
      const gen = getAllowDuplicateEmails();
      expect(gen.next()).toEqual({
        done: false,
        value: call(configureAuthSaga),
      });
      expect(gen.next(fakeAuthApi as unknown as AuthApi & boolean)).toEqual({
        done: false,
        value: call([fakeAuthApi, 'getConfig']),
      });
      expect(gen.next(false as unknown as AuthApi & boolean)).toEqual({
        done: false,
        value: put(setAllowDuplicateEmailsSuccess(false)),
      });
    });
  });

  describe('configureAuthSaga', () => {
    it('returns api', () => {
      const gen = configureAuthSaga();

      expect(gen.next()).toEqual({
        done: false,
        value: getContext(AUTH_API_CONTEXT),
      });

      const fakeAuthApi = { getConfig: jest.fn() };
      expect(gen.next(fakeAuthApi)).toEqual({
        done: true,
        value: fakeAuthApi,
      });
    });
  });
});
