import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import { WALLET_STATUS } from 'extension/constants';
import { popup } from 'index';
import { updateStatus, getAccounts } from 'reducers/wallet';

import Button from 'components/Button';
import CreateSuccess from 'components/CreateSuccess';

import './Welcome.css';

class Welcome extends Component {
    constructor(props) {
        super(props);

        this.state = {
            password: '',
            passwordRepeat: '',
            wrongPassword: false,
            showCreateSuccess: false
        };
    }

    _checkWalletStatus() {
        if(this.props.wallet.status == WALLET_STATUS.UNLOCKED)
            return this.goToWallet();
    }

    componentDidUpdate() {
        this._checkWalletStatus();
    }

    componentDidMount() {
        this._checkWalletStatus();
    }

    async goToWallet() {
        await getAccounts();
        this.props.history.push('/main/transactions');
    }

    handlePasswordChange({ target: { name, value } }) {
        this.setState({ 
            [name]: value,
            wrongPassword: false
        });
    }

    validatePassword() {
        const { password, passwordRepeat } = this.state;

        if (!password.length)
            return true;

        if (password === passwordRepeat)
            return true;

        return false;
    }

    async createWallet() {
        if(this.state.password !== this.state.passwordRepeat)
            return;

        const { 
            wordList: mnemonic,
            name
        } = await popup.setPassword(this.state.password);

        this.setState({
            showCreateSuccess: {
                onAcknowledged: () => {
                    updateStatus();
                    this.goToWallet();
                },
                accountName: name,
                imported: false,
                mnemonic
            }
        });
    }

    async login() {
        const correct = await popup.unlockWallets(this.state.password);
        
        if (!correct)
            return this.setState({ wrongPassword: true });

        updateStatus();
        this.goToWallet();
    }

    renderLogin() {
        return (
            <div>
                <div className="decryptContainer">
                    <input 
                        placeholder="Enter password to decrypt wallet"
                        className="textInput"
                        type="password"
                        name="password"
                        value={ this.state.password }
                        onChange={ event => this.handlePasswordChange(event) }
                        onKeyPress={ ({ key }) => key == 'Enter' && this.login() }
                    />

                    <span>
                        { this.state.wrongPassword ? 'Incorrect password provided' : '' }
                    </span>
                    
                    { this.renderWarning() }

                    <Button onClick={ () => this.login() } type={ 'black' } style={{ marginTop: '20px' }}>
                        Decrypt
                    </Button>
                </div>

                { /* <NavLink to="/import">
                    <div className="restoreWallet">Restore from seed phrase</div>
                </NavLink> */ }
            </div>
        );
    }

    renderRegister() {
        return (
            <div className="decryptContainer">
                <input 
                    placeholder="Enter password to encrypt wallet"
                    className="textInput"
                    type="password"
                    name="password"
                    value={ this.state.password }
                    onChange={ event => this.handlePasswordChange(event) }
                />

                <input 
                    placeholder="Repeat password"
                    className="textInput"
                    type="password"
                    name="passwordRepeat"
                    value={ this.state.passwordRepeat }
                    onChange={ event => this.handlePasswordChange(event) }
                    onKeyPress={ ({ key }) => key == 'Enter' && this.createWallet() }
                />

                <span>
                    { this.validatePassword() ? '' : 'Passwords do not match' }
                </span>

                { this.renderWarning() }

                <Button onClick={ () => this.createWallet() } type={ 'black' } style={{ marginTop: '20px' }}>
                    Continue
                </Button>
            </div>
        );
    }

    renderWarning() {
        const network = this.props.wallet.networks[this.props.wallet.selectedNetwork] || false;

        if(!network)
            return null;

        if(network.mainnet)
            return null;

        return (
            <div className="welcomeWarning">
                TronLink is currently running on the testnet. Please do not send any of your funds to this account, they will be lost.
            </div>
        );
    }

    render() {
        if(this.state.showCreateSuccess)
            return <CreateSuccess { ...this.state.showCreateSuccess } />;

        const status = this.props.wallet.status;

        if(status === WALLET_STATUS.UNLOCKED)
            return null;

        const walletView = status === WALLET_STATUS.LOCKED ? this.renderLogin() : this.renderRegister();

        return (
            <div className="welcome">
                <svg className="welcomeLogo" viewBox="0 0 150 121">
                    <defs>
                        <path id="a" d="M18.6222 0H75v56.3778C75 66.6625 66.6625 75 56.3778 75H18.6222C8.3375 75 0 66.6625 0 56.3778V18.6222C0 8.3375 8.3375 0 18.6222 0z"/>
                        <path id="c" d="M49.8054 74.7962h3.7664c.2426-2.2944.4872-4.6332.6916-6.9317l.0648-.5183c.216-1.8571.432-3.779.5615-5.701.2376-.1295.4968-.2591.7776-.367.324-.1512.648-.2808.9719-.4752 4.9892-2.6129 9.9784-5.2258 14.9892-7.8172 1.184-.615 2.3753-1.2348 3.5716-1.858v-4.1022c-.8825.46-1.7606.9184-2.6333 1.3745-4.0576 2.1035-8.2025 4.272-12.3692 6.4188 2.4215-2.5805 4.8648-5.1827 7.2863-7.7632 2.5192-2.7025 5.1288-5.4797 7.7162-8.2323v-9.8607c-9.1147-2.2453-18.2817-4.511-27.1874-6.7105-9.2594-2.281-18.4975-4.5618-27.757-6.8427a34.1553 34.1553 0 0 0-.7287-.1955c-.8359-.239-1.8004-.4996-2.8293-.3693-.3.0435-.5572.152-.793.3041l-.2572.2173c-.4073.391-.6216.8906-.7288 1.173l-.0643 1.173c5.8944 16.77 11.8959 33.6267 17.683 49.9405a44348.287 44348.287 0 0 0 2.5374 7.1436h4.0821C33.3106 58.519 27.4643 42.247 21.6181 25.9475c-.2832-.785-.588-1.5919-.8494-2.3551 5.8806 7.1088 11.8047 14.2613 17.5764 21.1956 2.9839 3.598 5.9678 7.1743 8.9516 10.7941.588.676 1.1761 1.3956 1.7424 2.0934.7405.894 1.481 1.8318 2.287 2.7258-.2614 2.246-.4792 4.5139-.7188 6.6945-.1525 1.5265-.305 3.0529-.4792 4.6011-.0653 1.0031-.196 1.9844-.3049 2.9439l-.0178.1554zm21.6309-7.3369l1.0327-1.5062a18.5504 18.5504 0 0 1-1.0327 1.5062zM75.2 28.9627c1.3273.327 2.6535.6535 3.9776.9793.6001.1955 1.0931.543 1.5218.8689.1072.0652.193.1303.2787.1955 3.8795 2.7805 7.8448 5.5827 11.5528 8.2112 1.2432.8254 1.2218 2.3895 1.1575 3.4104l-.15.2173c-2.8508 4.149-5.723 8.4066-8.5093 12.534-1.6933 2.498-3.3866 5.0179-5.0799 7.516-4.1367 6.104-8.2735 12.2299-12.4102 18.334l-16.9757 25.0896c-.4073.7386-1.2218 1.1948-2.3578 1.1948-.986-.0869-1.779-.6517-2.0576-1.5206-3.6701-10.3654-7.4108-20.8882-11.0732-31.1969h-16.088C8.732 74.7962.419 66.508.419 56.2838V18.751C.4189 8.527 8.732.2386 18.9868.2386H75.2v28.724zm0 9.8607v8.2022c3.8161-1.9887 7.714-4.0041 11.612-5.9767a238.8605 238.8605 0 0 1-3.4686-2.407c-1.5707-1.106-3.2068-2.2336-4.8212-3.3396-.24.282-.5017.5205-.7417.759-.349.347-.6762.6722-.938 1.0192l-.0655.065c-.524.5577-1.05 1.1173-1.577 1.6779zm-21.8697 18.923c-6.0919-7.4761-12.312-15.0602-18.3398-22.385-2.736-3.3276-5.4934-6.6767-8.2294-10.0042-.6413-.7347-1.2398-1.5125-1.8383-2.2472-.3847-.497-.7909-.9723-1.197-1.4693 2.4795.6482 4.9804 1.2532 7.4386 1.8366 2.1588.5186 4.4032 1.0588 6.6049 1.6206 12.3975 3.0466 24.8165 6.0932 37.214 9.1398-4.1254 4.4511-8.2721 8.967-12.2906 13.3317-3.0567 3.3491-6.2202 6.7847-9.3624 10.177zm.2415 17.0498c-.065.6156-.13 1.228-.194 1.8357-.1943 1.7923-.3887 3.671-.583 5.5066-.216 2.289-.4753 4.6212-.7128 6.8886-.2808 2.5482-.54 5.1611-.756 7.7525 1.7279-2.5698 3.499-5.1395 5.2268-7.6445 1.5335-2.2458 3.1534-4.578 4.7084-6.867 3.4033-4.9274 6.8225-9.9188 10.175-14.8088-3.3905 4.4578-8.76 7.337-14.8041 7.337h-3.0603zm18.8972-8.8431l.5849-.8527c4.4924-6.5864 9.136-13.3455 13.7581-20.0398-3.871 2.0258-7.7673 4.0642-11.612 6.0672v5.156c0 3.5439-.9988 6.8551-2.731 9.6693zm-22.6636 8.8431H39.1568c1.5372 4.2798 3.0744 8.56 4.6116 12.8411l2.3304 6.4765c.305.894.6316 1.8099.9583 2.6821.109.3053.2396.6324.3485.9595.196-1.8317.3703-3.6635.5663-5.4516.4574-4.3176.9365-8.766 1.3504-13.3236 0 0 .323-2.7892.483-4.184z"/>
                    </defs>
                    <g fill="none" fillRule="evenodd">
                        <path fill="#ED3F22" fillRule="nonzero" d="M82 120.5429v-11.6122L84.2852 105h1.8163v12.1515h5.8459v3.3914H82zm16.4884 0V105h4.1223v15.5429h-4.1223zm25.9686 0h-5.3786l-5.5448-10.9502h-.0935c.1315 1.7223.1973 3.037.1973 3.9442v7.006h-3.6342V105h5.3579l5.524 10.8013h.0623c-.097-1.5663-.1454-2.8243-.1454-3.774V105h3.655v15.5429zm20.3615 0h-4.631l-3.0009-5.9429-1.2149.7442v5.1987h-4.1222V105h4.1222v6.7508c.2077-.4181.6265-1.0808 1.2565-1.988L140.4159 105h4.4857l-4.7868 6.9635 4.7037 8.5794z"/>
                        <path fill="#aaa" fillRule="nonzero" d="M11.9466 120.7874H9.4649v-13.3635H5v-2.1794h11.4115v2.1794h-4.465v13.3635zm13.3837-8.3136h1.7237c1.156 0 1.9936-.2198 2.5128-.6592.5192-.4394.7788-1.0915.7788-1.9561 0-.8789-.2804-1.5097-.8411-1.8924-.5607-.3827-1.4052-.574-2.5336-.574h-1.6406v5.0817zm0 2.105v6.2086h-2.4816v-15.5429h4.2884c1.959 0 3.4092.3757 4.3506 1.127.9415.7512 1.4122 1.8852 1.4122 3.402 0 1.9348-.983 3.3133-2.949 4.1355l4.2885 6.8784H31.415l-3.6343-6.2087h-2.4505zm28.6995-1.5841c0 2.5302-.6179 4.497-1.8535 5.9003-1.2356 1.4033-2.9852 2.105-5.2489 2.105-2.2913 0-4.0512-.6963-5.28-2.089-1.2287-1.3927-1.843-3.3719-1.843-5.9376 0-2.5657.6178-4.536 1.8534-5.911C42.8935 105.6875 44.657 105 46.9482 105c2.2567 0 4.0011.6981 5.2333 2.0944 1.2322 1.3962 1.8483 3.363 1.8483 5.9003zm-11.588 0c0 1.9136.3772 3.3648 1.1318 4.3535.7545.9887 1.8725 1.483 3.3538 1.483 1.4745 0 2.5873-.489 3.3383-1.467.7511-.9782 1.1267-2.4346 1.1267-4.3695 0-1.9066-.3721-3.3524-1.1163-4.3376-.7441-.9851-1.8534-1.4777-3.3279-1.4777-1.4883 0-2.6114.4926-3.3694 1.4777-.758.9852-1.137 2.431-1.137 4.3376zm31.6068 7.7927h-3.0424l-7.4657-12.3854h-.083l.0518.691c.097 1.3183.1454 2.5232.1454 3.6146v8.0798h-2.2532v-15.5429h3.0112l7.445 12.3216h.0623c-.0139-.163-.0416-.7566-.0831-1.7807-.0415-1.0242-.0623-1.8233-.0623-2.3974v-8.1435h2.274v15.5429z"/>
                        <g transform="translate(36 5)">
                            <mask id="b" fill="#fff">
                                <use href="#a"/>
                            </mask>
                            <g mask="url(#b)">
                                <use fill="#ED3F22" href="#c"/>
                            </g>
                        </g>
                    </g>
                </svg>
                { walletView }
            </div>
        );
    }
}

export default withRouter(
    connect(
        state => ({ wallet: state.wallet }),
    )(Welcome)
);
