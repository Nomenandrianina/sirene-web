export class ClientAddDiffusionDto {
    souscriptionId: number;
    customerId:     number;
    // sireneId retiré — propagation automatique sur toutes les sirènes
    alerteAudioId:  number;
    date:           string; // "2026-07-01"
    heure:          number; // 7, 12 ou 16
}