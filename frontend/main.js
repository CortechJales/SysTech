import 'core-js/stable';
import 'regenerator-runtime/runtime';
import Login from './modules/Login';
import OrdemServico from './modules/OrdemServico';
import Relatorio from './modules/Relatorio'; 

const login = new Login('.form-login');
const cadastro = new Login('.form-cadastro');
const os = new OrdemServico('.form-os');
const relatorio = new Relatorio('.container-relatorio'); 

os.init();
login.init();
cadastro.init();
relatorio.init();