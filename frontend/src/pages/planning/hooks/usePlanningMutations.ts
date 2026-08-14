import { useMutation, useQueryClient } from '@tanstack/react-query';
import { diffusionPlanifieeApi } from '@/services/diffusionplanniee.api';
import { souscriptionApi } from '@/services/diffusion.api';
import type { AudioDisponible } from '@/types/useplanningclient';

interface UsePlanningMutationsParams {
  customerId:     number | undefined;
  souscriptionId: number | undefined;
  sireneId:       number | null;
  audios:         AudioDisponible[];
  showToast:      (msg: string, type?: 'success' | 'error') => void;
  onModifySuccess?:       () => void;
  onAutoGenerateSuccess?: () => void;
  onUpgradeScheduled?:    () => void;
}

/**
 * Regroupe toutes les mutations "secondaires" du planning client
 * (celles qui ne sont pas déjà gérées par usePlanningClient : add / cancel).
 */
export function usePlanningMutations({
  customerId, souscriptionId, sireneId, audios, showToast,
  onModifySuccess, onAutoGenerateSuccess, onUpgradeScheduled,
}: UsePlanningMutationsParams) {
  const qc = useQueryClient();

  const modifyMutation = useMutation({
    mutationFn: ({ diffusionId, alerteAudioId }: { diffusionId: number; alerteAudioId: number }) =>
      diffusionPlanifieeApi.clientModify({ diffusionId, alerteAudioId, customerId: customerId! }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['client-planning'] });
      onModifySuccess?.();
      const audioName = audios.find(a => a.id === variables.alerteAudioId)?.name
        ?? `Audio #${variables.alerteAudioId}`;
      showToast(`✅ Son modifié : "${audioName}"`);
    },
    onError: () => {
      showToast('❌ Erreur lors de la modification', 'error');
    },
  });

  const autoGenerateMutation = useMutation({
    mutationFn: (audioIds: number[]) =>
      diffusionPlanifieeApi.clientAutoGenerate({
        souscriptionId: souscriptionId!,
        customerId:     customerId!,
        sireneId:       sireneId!,
        audioIds,
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['client-planning'] });
      qc.invalidateQueries({ queryKey: ['souscriptions'] });
      onAutoGenerateSuccess?.();
      showToast(`✅ ${result.generated} diffusion${result.generated > 1 ? 's' : ''} générée${result.generated > 1 ? 's' : ''} automatiquement`);
    },
  });

  const cancelUpgradeMutation = useMutation({
    mutationFn: (id: number) => souscriptionApi.cancelScheduledUpgrade(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['souscriptions', 'client', customerId] });
      showToast('Changement annulé');
    },
  });

  const scheduleUpgradeMutation = useMutation({
    mutationFn: ({ id, packTypeId }: { id: number; packTypeId: number }) =>
      souscriptionApi.scheduleUpgrade(id, packTypeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['souscriptions', 'client', customerId] });
      onUpgradeScheduled?.();
      showToast('✅ Changement de pack programmé pour le prochain cycle');
    },
    onError: (e: any) => showToast(e?.response?.data?.message ?? 'Erreur', 'error'),
  });

  return { modifyMutation, autoGenerateMutation, cancelUpgradeMutation, scheduleUpgradeMutation };
}