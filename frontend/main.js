import 'core-js/stable';
import 'regenerator-runtime/runtime';
import Login from './modules/Login';
import OrdemServico from './modules/OrdemServico';

const login = new Login('.form-login');
const cadastro = new Login('.form-cadastro');
const os = new OrdemServico('.form-os');
os.init();
login.init();
cadastro.init();
//import './assets/css/style.css';
