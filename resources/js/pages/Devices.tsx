import { useState } from 'react';
import { useIntl } from 'react-intl';
import type { Device } from '../type';

type DevicesProps = {
  devices: Device[];
  isParent: boolean;
  busyKey: string;
  onRegister: (macAddress: string, name: string) => Promise<unknown>;
  onUnregister: (deviceId: number) => Promise<unknown>;
  onApprove: (deviceId: number) => Promise<unknown>;
  onReject: (deviceId: number) => Promise<unknown>;
};

export default function Devices({ devices, isParent, busyKey, onRegister, onUnregister, onApprove, onReject }: DevicesProps) {
  const intl = useIntl();
  const [macAddress, setMacAddress] = useState('');
  const [name, setName] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const succeeded = await onRegister(macAddress.trim(), name.trim());
    if (succeeded) {
      setMacAddress('');
      setName('');
    }
  }

  return (
    <div className="activity-page">
      <section className="activity-panel">
        <h2 className="activity-title">📱 {intl.formatMessage({ id: 'devices.title', defaultMessage: 'Devices' })}</h2>
        {!isParent && (
          <>
            <p>{intl.formatMessage({ id: 'devices.instructions', defaultMessage: 'Register a device to request direct Wi-Fi access. Use the MAC address for this Wi-Fi network and turn off private or randomized MAC addresses for it.' })}</p>
            <form className="crud-panel" onSubmit={(event) => void submit(event)}>
              <div className="form-field">
                <label htmlFor="device-name">{intl.formatMessage({ id: 'devices.name', defaultMessage: 'Device name' })}</label>
                <input id="device-name" className="crud-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="My phone" />
              </div>
              <div className="form-field">
                <label htmlFor="device-mac">{intl.formatMessage({ id: 'devices.mac', defaultMessage: 'MAC address' })}</label>
                <input id="device-mac" className="crud-input" value={macAddress} onChange={(event) => setMacAddress(event.target.value)} placeholder="AA:BB:CC:DD:EE:FF" pattern="^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$" required />
              </div>
              <button className="crud-submit-btn" type="submit" disabled={busyKey === 'device:create'}>
                {intl.formatMessage({ id: 'devices.register', defaultMessage: 'Request registration' })}
              </button>
            </form>
          </>
        )}

        {devices.length === 0 ? (
          <p className="activity-empty">{intl.formatMessage({ id: isParent ? 'devices.noPending' : 'devices.empty', defaultMessage: isParent ? 'No devices are waiting for approval.' : 'No registered devices yet.' })}</p>
        ) : (
          <div className="activity-list">
            {devices.map((device) => (
              <article className="activity-card" key={device.id}>
                <div>
                  <div className="activity-name">{device.name || intl.formatMessage({ id: 'devices.unnamed', defaultMessage: 'Device' })}</div>
                  <div className="activity-meta">{device.user ? `${device.user.name} · ` : ''}<code>{device.macAddress}</code></div>
                  {!isParent && <div className={`activity-status ${device.status === 'pending_approval' ? 'pending' : device.status}`}>{intl.formatMessage({ id: `devices.status.${device.status}`, defaultMessage: device.status.replaceAll('_', ' ') })}</div>}
                </div>
                {isParent ? (
                  <div className="crud-actions">
                    <button className="crud-submit-btn" disabled={busyKey === `device:approve:${device.id}`} onClick={() => void onApprove(device.id)}>{intl.formatMessage({ id: 'devices.approve', defaultMessage: 'Approve' })}</button>
                    <button className="crud-delete-btn" disabled={busyKey === `device:reject:${device.id}`} onClick={() => void onReject(device.id)}>{intl.formatMessage({ id: 'devices.reject', defaultMessage: 'Reject' })}</button>
                  </div>
                ) : (
                  <button className="crud-delete-btn" disabled={busyKey === `device:delete:${device.id}`} onClick={() => {
                    if (window.confirm(intl.formatMessage({ id: 'devices.confirmRemove', defaultMessage: 'Unregister this device and revoke its Wi-Fi access?' }))) {
                      void onUnregister(device.id);
                    }
                  }}>{intl.formatMessage({ id: 'devices.unregister', defaultMessage: 'Unregister' })}</button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
