import { FilePresetProvider } from './file-preset.provider';

describe('FilePresetProvider', () => {
  it('loads presets from filesystem and resolves default', async () => {
    const provider = new FilePresetProvider();
    const presets = await provider.getPresets('berlin-1933');
    expect(presets.length).toBeGreaterThan(0);

    const selected = await provider.getSelectedPreset({ capsuleId: 'berlin-1933' });
    expect(selected.presetId).toBe('default');
  });

  it('throws on unknown preset id', async () => {
    const provider = new FilePresetProvider();
    await expect(
      provider.getSelectedPreset({
        capsuleId: 'berlin-1933',
        presetId: 'missing'
      })
    ).rejects.toThrow('Preset missing not found');
  });
});
