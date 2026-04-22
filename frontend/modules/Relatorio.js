export default class Relatorio {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.coresGlobal = {
            maoDeObra: '#28a745', // Verde
            pecas: '#007bff',     // Azul
            status: {
                'Em orçamento': '#ffc107',
                'Aguardando cliente': '#36A2EB',
                'Em execução': '#4BC0C0',
                'Atendido': '#0d6efd',
                'Fechado': '#333333'
            }
        };
    }

    init() {
        if (!this.container) return;
        this.geraGraficos();
    }

    geraGraficos() {
        const dadosJson = document.getElementById('dados-json');
        if (!dadosJson) return;

        const dados = JSON.parse(dadosJson.textContent);
        const inputInicio = document.getElementsByName('dataInicio')[0];
        const dataInicioFiltro = inputInicio ? inputInicio.value : null;

        // Execução dos métodos de criação
        this.criaGraficoStatus(dados);
        this.criaGraficoData(dados);
        this.criaGraficoTotalStatus(dados);
        this.criaGraficoItens(dados);
        this.criaGraficoComposicao(dados);
        this.criaGraficoGeralComposicao(dados);
        this.criaGraficoClientesNovos(dados, dataInicioFiltro);
    }

    criaGraficoStatus(dados) {
        const statusCount = {};
        const totalOS = dados.length;

        dados.forEach(os => {
            statusCount[os.status] = (statusCount[os.status] || 0) + 1;
        });

        const ctx = document.getElementById('graficoStatus');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(statusCount),
                datasets: [{
                    label: 'OS por Status',
                    data: Object.values(statusCount),
                    backgroundColor: Object.keys(statusCount).map(s => this.coresGlobal.status[s] || '#999')
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = totalOS > 0 ? ((value / totalOS) * 100).toFixed(1) : 0;
                                return `${label}: ${value} OS (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    criaGraficoData(dados) {
        const dateCount = {};
        const dadosOrdenados = [...dados].sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));

        dadosOrdenados.forEach(os => {
            const data = new Date(os.data_inicio).toLocaleDateString('pt-BR');
            dateCount[data] = (dateCount[data] || 0) + 1;
        });

        const ctx = document.getElementById('graficoDias');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(dateCount),
                datasets: [{
                    label: 'Qtd de OS',
                    data: Object.values(dateCount),
                    borderColor: this.coresGlobal.pecas,
                    backgroundColor: this.coresGlobal.pecas + '33',
                    borderWidth: 4,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 6,
                    pointBackgroundColor: this.coresGlobal.pecas,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: (value) => Math.floor(value) === value ? value : null
                        }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    criaGraficoTotalStatus(dados) {
        const totalPorStatus = {};
        let valorTotalGeral = 0;

        dados.forEach(os => {
            const valor = parseFloat(os.valorTotalGeral) || 0;
            valorTotalGeral += valor;
            totalPorStatus[os.status] = (totalPorStatus[os.status] || 0) + valor;
        });

        const ctx = document.getElementById('graficoTotal');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(totalPorStatus),
                datasets: [{
                    data: Object.values(totalPorStatus),
                    backgroundColor: Object.keys(totalPorStatus).map(s => this.coresGlobal.status[s] || '#999')
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Faturamento Total: R$ ${valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const percentage = valorTotalGeral > 0 ? ((value / valorTotalGeral) * 100).toFixed(1) : 0;
                                return `${label}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    criaGraficoItens(dados) {
        const itemContagem = {};
        const itemFinanceiro = {};

        dados.forEach(os => {
            os.itens?.forEach(item => {
                const nome = item.descricao || "Sem descrição";
                const qtd = parseFloat(item.quantidade) || 0;
                const valorTotal = parseFloat(item.valorTotalItem) || 0;
                itemContagem[nome] = (itemContagem[nome] || 0) + qtd;
                itemFinanceiro[nome] = (itemFinanceiro[nome] || 0) + valorTotal;
            });
        });

        const itensOrdenados = Object.entries(itemContagem).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const labels = itensOrdenados.map(i => i[0]);

        const ctx = document.getElementById('graficoItens');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quantidade Total',
                    data: itensOrdenados.map(i => i[1]),
                    backgroundColor: '#4BC0C0',
                    financeiro: labels.map(nome => itemFinanceiro[nome])
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    tooltip: {
                        callbacks: {
                            footer: (context) => {
                                const valorRS = context[0].dataset.financeiro[context[0].dataIndex];
                                return `Valor Acumulado: R$ ${valorRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                            }
                        }
                    }
                }
            }
        });
    }

    criaGraficoComposicao(dados) {
        const ultimasOS = dados.slice(0, 15).reverse();
        const labels = ultimasOS.map(os => {
            const data = new Date(os.data_inicio).toLocaleDateString('pt-BR');
            return `${os.cliente?.nome?.split(' ')[0] || 'S/N'} (${data})`;
        });

        const dadosPecas = ultimasOS.map(os => (os.itens || []).filter(i => i.tipo !== 'Serviço').reduce((acc, item) => acc + (parseFloat(item.valorTotalItem) || 0), 0));
        const dadosMaoDeObra = ultimasOS.map(os => {
            const fixa = parseFloat(os.mao_de_obra) || 0;
            const itensServico = (os.itens || []).filter(i => i.tipo === 'Serviço').reduce((acc, item) => acc + (parseFloat(item.valorTotalItem) || 0), 0);
            return fixa + itensServico;
        });

        const ctx = document.getElementById('graficoComposicao');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Peças/Produtos', data: dadosPecas, backgroundColor: this.coresGlobal.pecas },
                    { label: 'Mão de Obra', data: dadosMaoDeObra, backgroundColor: this.coresGlobal.maoDeObra }
                ]
            },
            options: {
                responsive: true,
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, grace: '15%' } },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (c) => `${c.dataset.label}: R$ ${c.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        }
                    }
                }
            },
            plugins: [{
                id: 'datalabels',
                afterDraw: (chart) => {
                    const { ctx, scales: { x, y } } = chart;
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 11px Arial';
                    chart.data.labels.forEach((label, index) => {
                        const total = chart.data.datasets[0].data[index] + chart.data.datasets[1].data[index];
                        if (total > 0) ctx.fillText(`R$ ${total.toFixed(2)}`, x.getPixelForValue(label), y.getPixelForValue(total) - 10);
                    });
                    ctx.restore();
                }
            }]
        });
    }

    criaGraficoGeralComposicao(dados) {
        let totalMO = 0;
        let totalPecas = 0;

        dados.forEach(os => {
            totalMO += parseFloat(os.mao_de_obra) || 0;
            os.itens?.forEach(item => {
                if (item.tipo === 'Serviço') totalMO += parseFloat(item.valorTotalItem) || 0;
                else totalPecas += parseFloat(item.valorTotalItem) || 0;
            });
        });

        const total = totalMO + totalPecas;
        const ctx = document.getElementById('graficoGeralComposicao');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Mão de Obra', 'Peças'],
                datasets: [{
                    data: [totalMO, totalPecas],
                    backgroundColor: [this.coresGlobal.maoDeObra, this.coresGlobal.pecas]
                }]
            },
            options: {
                plugins: {
                    title: { display: true, text: `Total: R$ ${total.toLocaleString('pt-BR')}` },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw || 0;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    criaGraficoClientesNovos(dados, dataInicioFiltro) {
        let novos = 0, antigos = 0;
        const clientesProcessados = new Set();
        const ref = dataInicioFiltro ? new Date(dataInicioFiltro) : new Date(new Date().setDate(new Date().getDate() - 30));

        dados.forEach(os => {
            if (os.cliente?._id && !clientesProcessados.has(os.cliente._id)) {
                clientesProcessados.add(os.cliente._id);
                new Date(os.cliente.criadoEm) >= ref ? novos++ : antigos++;
            }
        });

        const totalClientes = novos + antigos;
        const ctx = document.getElementById('graficoNovosClientes');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Novos', 'Antigos'],
                datasets: [{
                    data: [novos, antigos],
                    backgroundColor: [this.coresGlobal.status['Em orçamento'], '#6c757d']
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw || 0;
                                const percentage = totalClientes > 0 ? ((value / totalClientes) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}