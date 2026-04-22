const SyncQueueSchema = require('../models/SyncQueueModel');
const { LoginSchema } = require('../models/LoginModel');
const { ClienteSchema } = require('../models/ClienteModel');
const { MarcaSchema } = require('../models/MarcaModel');
const { EquipamentoSchema } = require('../models/EquipamentoModel');
const { ProdutoSchema } = require('../models/ProdutoModel');
const { OrdemServicoSchema } = require('../models/osModel');

/**
 * Motor de Sincronização LOCAL -> ONLINE
 * replica todas as ações pendentes no banco local para o MongoDB Atlas.
 */
async function processQueue(localConn, onlineConn) {
  // 1. Verificação de Conexão: Só processa se ambos os bancos estiverem online
  if (!onlineConn || onlineConn.readyState !== 1 || !localConn || localConn.readyState !== 1) {
    return;
  }

  // 2. Instancia a Fila no banco Local
  const LocalQueue = localConn.models.SyncQueue || localConn.model('SyncQueue', SyncQueueSchema);
  
  // 3. Mapeamento dos Modelos no banco Online (Nuvem)
  const OnlineModels = {
    Login: onlineConn.models.Login || onlineConn.model('Login', LoginSchema),
    Cliente: onlineConn.models.Cliente || onlineConn.model('Cliente', ClienteSchema),
    Marca: onlineConn.models.Marca || onlineConn.model('Marca', MarcaSchema),
    Equipamento: onlineConn.models.Equipamento || onlineConn.model('Equipamento', EquipamentoSchema),
    Produto: onlineConn.models.Produto || onlineConn.model('Produto', ProdutoSchema),
    OrdemServico: onlineConn.models.OrdemServico || onlineConn.model('OrdemServico', OrdemServicoSchema)
  };

  // 4. Busca os 15 itens mais antigos (FIFO - First In, First Out)
  const jobs = await LocalQueue.find().sort({ createdAt: 1 }).limit(15);

  if (jobs.length > 0) console.log(`🔄 [SYNC] Processando ${jobs.length} tarefas pendentes...`);

  for (const job of jobs) {
    try {
      const TargetModel = OnlineModels[job.collectionName];

      if (!TargetModel) {
        console.warn(`⚠️ Coleção '${job.collectionName}' não mapeada. Removendo da fila.`);
        await LocalQueue.findByIdAndDelete(job._id);
        continue;
      }

      // 5. Execução da Ação Baseada no Tipo (Create, Update ou Delete)
      switch (job.action) {
        case 'create':
          // Proteção extra para Login (evita erro de duplicidade de e-mail)
          if (job.collectionName === 'Login') {
            const exists = await TargetModel.findOne({ email: job.payload.email });
            if (exists) break; 
          }
          await TargetModel.create(job.payload);
          break;

        case 'update':
          // Atualiza o documento remoto usando o ID persistido no Local
          if (job.payload._id) {
            await TargetModel.findByIdAndUpdate(job.payload._id, job.payload, { new: true });
          }
          break;

        case 'delete':
          // Remove fisicamente da nuvem
          if (job.payload._id) {
            await TargetModel.findByIdAndDelete(job.payload._id);
          }
          break;

        default:
          console.error(`❌ Ação desconhecida: ${job.action}`);
      }

      // 6. Sucesso: Remove o item da fila local para não repetir
      await LocalQueue.findByIdAndDelete(job._id);
      console.log(`✔️ [SYNC SUCCESS] ${job.collectionName} -> ${job.action}`);

    } catch (err) {
      // 7. Falha: Registra o erro e incrementa tentativas para evitar travamento da fila
      console.error(`❌ [SYNC FAIL] Job ${job._id} (${job.collectionName}):`, err.message);
      
      job.attempts += 1;
      job.lastError = err.message;
      
      // Salva o erro no banco local para consulta posterior
      await job.save();
    }
  }
}

module.exports = { processQueue };