import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import userSelectors from 'src/modules/user/userSelectors';
import selectors from 'src/modules/user/list/userListSelectors';
import actions from 'src/modules/user/list/userListActions';
import { Link } from 'react-router-dom';
import { i18n } from 'src/i18n';
import Pagination from 'src/view/shared/table/Pagination';
import Spinner from 'src/view/shared/Spinner';
import TableColumnHeader from 'src/view/shared/table/TableColumnHeader';
import ConfirmModal from 'src/view/shared/modals/ConfirmModal';
import Roles from 'src/security/roles';
import UserStatusView from 'src/view/user/view/UserStatusView';
import Avatar from 'src/view/shared/Avatar';
import TableWrapper from 'src/view/shared/styles/TableWrapper';
import recordListActions from 'src/modules/record/list/recordListActions';
import selectorTaskdone from 'src/modules/record/list/recordListSelectors';
import UserService from 'src/modules/user/userService';

function UserTable() {
  const dispatch = useDispatch();
  const [recordIdToDestroy, setRecordIdToDestroy] = useState(null);
  const [recordIdToTotalDestroy, setRecordIdToTotalDestroy] = useState(null);
  const [totalTask, setTotalTasks] = useState('');
  const tasksdone = useSelector(selectorTaskdone.selectCountRecord);
  const LoadingTasksDone = useSelector(selectorTaskdone.selectLoading);
  const loading = useSelector(selectors.selectLoading);
  const rows = useSelector(selectors.selectRows);
  const pagination = useSelector(selectors.selectPagination);
  const selectedKeys = useSelector(selectors.selectSelectedKeys);
  const [showTask, setShowTask] = useState(false);
  const hasRows = useSelector(selectors.selectHasRows);
  const sorter = useSelector(selectors.selectSorter);
  const isAllSelected = useSelector(selectors.selectIsAllSelected);
  const hasPermissionToEdit = useSelector(userSelectors.selectPermissionToEdit);
  const hasPermissionToDestroy = useSelector(
    userSelectors.selectPermissionToDestroy,
  );

  const doDestroy = (id) => {
    setRecordIdToDestroy(null);
    dispatch(actions.doDestroy(id));
  };

  const doTotalDestroy = (id) => {
    setRecordIdToTotalDestroy(null);
    dispatch(actions.doDestroyAllFull(id));
  };

  const doChangeSort = (field) => {
    const order =
      sorter.field === field && sorter.order === 'ascend'
        ? 'descend'
        : 'ascend';

    dispatch(
      actions.doChangeSort({
        field,
        order,
      }),
    );
  };

  const doChangePagination = (pagination) => {
    dispatch(actions.doChangePagination(pagination));
  };

  const doToggleAllSelected = () => {
    dispatch(actions.doToggleAllSelected());
  };

  const doToggleOneSelected = (id) => {
    dispatch(actions.doToggleOneSelected(id));
  };

  const showThecurrentRecord = async (id, totaltask?) => {
    setShowTask(true);
    await dispatch(recordListActions.doTasksDone(id));
    setTotalTasks(totaltask);
  };

  useEffect(() => {}, [dispatch, tasksdone]);

  const oneClick = async (id) => {
    await UserService.doOneClickLogin(id);
  };

  return (
    <>
      {/* CSS Styles */}
      <style>{`
        /* Container for the whole table wrapper */
        .user-list-container .table-responsive {
          overflow-x: auto;
        }

        /* Sticky Actions Column (both header and body cells) */
        .actions-header,
        .user-table-actions {
          position: sticky;
          right: 0;
          background-color: #fff;
          z-index: 2;
        }

        /* Ensure the header is above body cells */
        .actions-header {
          z-index: 3;
        }

        /* Actions wrapper: display flex, horizontal row, centered */
        .user-table-actions-content {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: flex-start;
        }

        /* Base button/link styling for actions (optional, depending on your classes) */
        .user-table-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #f9f9f9;
          color: #333;
          font-size: 0.85rem;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .user-table-action-btn:hover {
          background: #e9e9e9;
        }

        /* Optional color overrides (kept from previous classes) */
        .user-table-action-btn.primary { background: #1890ff; border-color: #1890ff; color: white; }
        .user-table-action-btn.success { background: #52c41a; border-color: #52c41a; color: white; }
        .user-table-action-btn.info { background: #13c2c2; border-color: #13c2c2; color: white; }
        .user-table-action-btn.warning { background: #faad14; border-color: #faad14; color: white; }
        .user-table-action-btn.danger { background: #ff4d4f; border-color: #ff4d4f; color: white; }
        .user-table-action-btn.dark { background: #262626; border-color: #262626; color: white; }
        .user-table-action-btn:hover {
          opacity: 0.85;
        }

        /* Modal overlay styles */
        .user-table-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .user-table-modal-content {
          background: #fff;
          border-radius: 8px;
          padding: 24px;
          min-width: 260px;
          max-width: 90%;
          text-align: center;
          position: relative;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .user-table-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
        }

        .user-table-modal-text {
          margin: 0 0 16px;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .user-table-progress {
          font-size: 2rem;
          font-weight: bold;
          color: #1890ff;
        }

        /* General table improvements */
        .user-list-table {
          width: 100%;
          border-collapse: collapse;
        }
        .table-header th {
          white-space: nowrap;
        }
        .table-cell {
          padding: 8px;
          border-bottom: 1px solid #f0f0f0;
        }
      `}</style>

      <div className="user-list-container">
        <TableWrapper>
          <div className="table-responsive">
            <table className="user-list-table">
              <thead className="table-header">
                <tr>
                  <th
                    className="sortable-header"
                    onClick={() => doChangeSort('email')}
                  >
                    {i18n('user.fields.email')}
                    {sorter.field === 'email' && (
                      <span className="sort-icon">
                        {sorter.order === 'ascend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => doChangeSort('invitationcode')}
                  >
                    {i18n('user.fields.invitationcode')}
                    {sorter.field === 'invitationcode' && (
                      <span className="sort-icon">
                        {sorter.order === 'ascend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    className="sortable-header"
                    onClick={() => doChangeSort('refcode')}
                  >
                    {i18n('user.fields.refcode')}
                    {sorter.field === 'refcode' && (
                      <span className="sort-icon">
                        {sorter.order === 'ascend' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th className="table-header">
                    {i18n('user.fields.roles')}
                  </th>
                  <th className="table-header text-center">
                    {i18n('user.fields.status')}
                  </th>
                  <th className="table-header text-center">
                    {i18n('user.fields.country')}
                  </th>
                  {/* Sticky Actions header */}
                  <th className="actions-header text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="table-body">
                {loading && (
                  <tr>
                    <td colSpan={7} className="loading-cell">
                      <div className="loading-container">
                        <Spinner />
                        <span className="loading-text">
                          Loading data...
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && !hasRows && (
                  <tr>
                    <td colSpan={7} className="no-data-cell">
                      <div className="no-data-content">
                        <i className="fas fa-database no-data-icon"></i>
                        <p>{i18n('table.noData')}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((row) => (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell">{row.email}</td>
                      <td className="table-cell">{row.invitationcode}</td>
                      <td className="table-cell">{row.refcode}</td>
                      <td className="table-cell">
                        {row.roles.map((roleId) => (
                          <div key={roleId}>
                            <span>{Roles.labelOf(roleId)}</span>
                          </div>
                        ))}
                      </td>
                      <td className="table-cell text-center">
                        <UserStatusView value={row.status} />
                      </td>
                      <td className="table-cell text-center">
                        <span>
                          {row.country} <br />
                          {row.ipAddress}
                        </span>
                      </td>
                      {/* Sticky Actions cell */}
                      <td className="user-table-actions">
                        <div className="user-table-actions-content">
                          {/* Tasks */}
                          <button
                            className="user-table-action-btn success"
                            onClick={() =>
                              showThecurrentRecord(
                                row.id,
                                row?.vip?.dailyorder,
                              )
                            }
                          >
                            <i className="fas fa-tasks user-table-action-icon" />
                            Tasks
                          </button>

                          {/* Password */}
                          <Link
                            className="user-table-action-btn info"
                            to={`/password-reset/${row.id}`}
                          >
                            <i className="fas fa-key user-table-action-icon" />
                            Password
                          </Link>

                          {/* View */}
                          <Link
                            className="user-table-action-btn warning"
                            to={`/user/${row.id}`}
                          >
                            <i className="fas fa-eye user-table-action-icon" />
                            View
                          </Link>

                          {/* Edit */}
                          <Link
                            className="user-table-action-btn primary"
                            to={`/user/${row.id}/edit`}
                          >
                            <i className="fas fa-edit user-table-action-icon" />
                            Edit
                          </Link>

                          {/* Freeze */}
                          <button
                            className="user-table-action-btn danger"
                            onClick={() =>
                              setRecordIdToDestroy(row.id)
                            }
                          >
                            <i className="fas fa-lock user-table-action-icon" />
                            Freeze
                          </button>

                          {/* Total Delete */}
                          <button
                            className="user-table-action-btn dark"
                            onClick={() =>
                              setRecordIdToTotalDestroy(row.id)
                            }
                          >
                            <i className="fas fa-trash-alt user-table-action-icon" />
                            Total Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </TableWrapper>

        <div className="pagination-container">
          <Pagination
            onChange={doChangePagination}
            disabled={loading}
            pagination={pagination}
          />
        </div>

        {recordIdToDestroy && (
          <ConfirmModal
            title={i18n('common.areYouSure')}
            onConfirm={() => doDestroy(recordIdToDestroy)}
            onClose={() => setRecordIdToDestroy(null)}
            okText={i18n('common.yes')}
            cancelText={i18n('common.no')}
          />
        )}

        {recordIdToTotalDestroy && (
          <ConfirmModal
            title={i18n('common.areYouSure')}
            message={i18n('user.doDestroyAllFullConfirm')}
            onConfirm={() => doTotalDestroy(recordIdToTotalDestroy)}
            onClose={() => setRecordIdToTotalDestroy(null)}
            okText={i18n('common.yes')}
            cancelText={i18n('common.no')}
          />
        )}

        {!LoadingTasksDone && showTask && (
          <div className="user-table-modal-overlay">
            <div className="user-table-modal-content">
              <button
                className="user-table-modal-close"
                onClick={() => setShowTask(false)}
              >
                <i className="fas fa-times" />
              </button>
              <h3 className="user-table-modal-text">
                Task Progress
              </h3>
              <div className="user-table-progress">
                {tasksdone} / {totalTask}
              </div>
              <div
                style={{
                  marginTop: '15px',
                  fontSize: '14px',
                  color: '#666',
                }}
              >
                Tasks Completed
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default UserTable;