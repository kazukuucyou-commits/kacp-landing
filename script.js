// KACPランディングページ用JavaScript

// ハンバーガーメニュー
const hamburger = document.getElementById('hamburger');
const nav = document.querySelector('.nav');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        nav.classList.toggle('active');
        
        // アニメーション
        const spans = hamburger.querySelectorAll('span');
        if (nav.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(8px, 8px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(8px, -8px)';
            
            // モバイルメニュー表示（背景と重ならないようにオーバーレイ）
            nav.style.display = 'flex';
            // 固定配置はCSSに委ねる
            // オーバーレイ生成
            let overlay = document.querySelector('.mobile-nav-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'mobile-nav-overlay';
                document.body.appendChild(overlay);
                overlay.addEventListener('click', () => {
                    // 背景タップで閉じる
                    nav.classList.remove('active');
                    nav.style.display = 'none';
                    document.body.style.overflow = '';
                    overlay.remove();
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                });
            }
            document.body.style.overflow = 'hidden';
            
            // メニュー内リンククリックで閉じる
            nav.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => {
                    const ov = document.querySelector('.mobile-nav-overlay');
                    if (ov) ov.remove();
                    nav.classList.remove('active');
                    nav.style.display = 'none';
                    document.body.style.overflow = '';
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }, { once: true });
            });
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
            
            // メニューを閉じる
            if (window.innerWidth <= 768) {
                nav.style.display = 'none';
            }
            const overlay = document.querySelector('.mobile-nav-overlay');
            if (overlay) overlay.remove();
            document.body.style.overflow = '';
        }
    });
}

// スムーススクロール
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offsetPosition = target.offsetTop - 20;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// スクロールアニメーション（フェードイン効果）
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    // アニメーション対象の要素を設定
    const animateElements = document.querySelectorAll(
        '.feature-box, .plan-box, .review-box, .step'
    );
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeInObserver.observe(el);
    });

    // CTAボタンのホバーエフェクト強化
    const mainButtons = document.querySelectorAll('.btn-main');
    const subButtons = document.querySelectorAll('.btn-sub');
    
    mainButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    subButtons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });

    // 数字のカウントアップアニメーション（価格表示用）
    animateNumbers();

    // プランボタンをクリックしたら About 見出しを更新
    const serviceNameEl = document.getElementById('serviceName');
    if (serviceNameEl) {
        document.querySelectorAll('.btn-plan:not(.btn-plan-outline)').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.textContent ? btn.textContent.trim() : '';
                if (text) {
                    serviceNameEl.textContent = text;
                }
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
});

// 数字をカウントアップするアニメーション
function animateNumbers() {
    const priceElements = document.querySelectorAll('.plan-box strong');
    
    priceElements.forEach(el => {
        const text = el.textContent;
        const matches = text.match(/(\d+,?\d*)/);
        
        if (matches) {
            const targetNumber = parseInt(matches[1].replace(',', ''));
            if (targetNumber > 100) {
                let current = 0;
                const increment = targetNumber / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= targetNumber) {
                        current = targetNumber;
                        clearInterval(timer);
                    }
                    el.textContent = text.replace(matches[1], Math.floor(current).toLocaleString());
                }, 20);
            }
        }
    });
}

// 特徴カードのホバーエフェクト
const featureBoxes = document.querySelectorAll('.feature-box');
featureBoxes.forEach(box => {
    box.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px)';
    });
    box.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// プランカードのホバーエフェクト
const planBoxes = document.querySelectorAll('.plan-box');
planBoxes.forEach(box => {
    box.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.02)';
        this.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
    });
    box.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '';
    });
});

// テーブルの行ハイライト
const tableRows = document.querySelectorAll('table tr');
tableRows.forEach((row, index) => {
    if (index > 0) { // ヘッダー行を除く
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(29, 58, 99, 0.05)';
        });
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    }
});

// ページトップへ戻るボタン（オプション）
function createBackToTop() {
    const button = document.createElement('button');
    button.innerHTML = '↑';
    button.className = 'back-to-top';
    button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #1D3A63;
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    `;
    
    document.body.appendChild(button);
    
    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            button.style.opacity = '1';
        } else {
            button.style.opacity = '0';
        }
    });
}

// ページロード時にトップへ戻るボタンを作成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBackToTop);
} else {
    createBackToTop();
}

// 契約書モーダル機能は削除しました

// お問い合わせフォームを開く（既存機能）
function openContactForm() {
    const planNameEl = document.getElementById('selectedPlanName');
    const pdfFrame = document.getElementById('contractPdfFrame');
    const dateField = document.getElementById('signatureDate');
    
    // プラン名を設定
    planNameEl.textContent = planName;
    
    // PDF読み込み
    pdfFrame.src = pdfPath;
    
    // 現在日時を署名日に設定
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    dateField.value = dateStr;
    
    // モーダル表示
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // 背景スクロール防止
}

// 契約書モーダルを閉じる
function closeContractModal() {
    const modal = document.getElementById('contractModal');
    const form = document.getElementById('signatureForm');
    const pdfFrame = document.getElementById('contractPdfFrame');
    
    // フォームリセット
    form.reset();
    pdfFrame.src = '';
    
    // モーダル非表示
    modal.style.display = 'none';
    document.body.style.overflow = ''; // スクロール復元
}

// 署名フォーム送信処理の初期化
document.addEventListener('DOMContentLoaded', () => {
    const signatureForm = document.getElementById('signatureForm');
    const agreeCheckbox = document.getElementById('agreeContract');
    const submitButton = document.getElementById('submitSignature');
    
    // チェックボックスの状態で送信ボタンを制御
    if (agreeCheckbox && submitButton) {
        agreeCheckbox.addEventListener('change', () => {
            submitButton.disabled = !agreeCheckbox.checked;
        });
    }
    
    // フォーム送信
    if (signatureForm) {
        signatureForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!agreeCheckbox.checked) {
                alert('契約内容に同意してください。');
                return;
            }
            
            // フォームデータ収集
            const formData = {
                plan: document.getElementById('selectedPlanName').textContent,
                name: document.getElementById('signerName').value,
                email: document.getElementById('signerEmail').value,
                phone: document.getElementById('signerPhone').value,
                signatureDate: document.getElementById('signatureDate').value,
                timestamp: new Date().toISOString()
            };
            
            // ローディング表示
            submitButton.textContent = '送信中...';
            submitButton.disabled = true;
            
            try {
                // デモ用の遅延
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // 成功メッセージ
                alert(`ご契約ありがとうございます！\n\n${formData.name}様の署名を受け付けました。\n確認メールを ${formData.email} に送信しました。`);
                
                // モーダルを閉じる
                closeContractModal();
                
                // CTAセクションへスクロール（オプション）
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                }
                
            } catch (error) {
                console.error('署名送信エラー:', error);
                alert('送信に失敗しました。もう一度お試しください。');
            } finally {
                submitButton.textContent = '署名して申し込む';
                submitButton.disabled = false;
            }
        });
    }
    
    // モーダル外クリックで閉じる
    const contractModal = document.getElementById('contractModal');
    if (contractModal) {
        contractModal.addEventListener('click', (e) => {
            if (e.target === contractModal) {
                closeContractModal();
            }
        });
    }
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('contractModal');
            if (modal && modal.style.display === 'flex') {
                closeContractModal();
            }
        }
    });
});

// お問い合わせフォームを開く（既存機能）
function openContactForm() {
    const modal = document.createElement('div');
    modal.className = 'contact-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
            <h3>無料相談・お申し込み</h3>
            <form class="contact-form">
                <div class="form-group">
                    <label>お名前 <span class="required">*</span></label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>電話番号 <span class="required">*</span></label>
                    <input type="tel" name="phone" required>
                </div>
                <div class="form-group">
                    <label>メールアドレス <span class="required">*</span></label>
                    <input type="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>ご希望のプラン</label>
                    <select name="plan">
                        <option value="">選択してください</option>
                        <option value="home">KACP HOME（家庭向け）</option>
                        <option value="business">KACP（事業者向け）</option>
                        <option value="one">KACP ONE（単発）</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>お問い合わせ内容</label>
                    <textarea name="message" rows="4"></textarea>
                </div>
                <button type="submit" class="btn-submit">送信する</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // フォーム送信処理
    const form = modal.querySelector('form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const name = formData.get('name');
        const phone = formData.get('phone');
        const email = formData.get('email');
        const plan = formData.get('plan');
        const message = formData.get('message');
        
        const subject = encodeURIComponent('【KACP】お問い合わせ');
        const body = encodeURIComponent(
            `お名前: ${name}\n` +
            `電話番号: ${phone}\n` +
            `メールアドレス: ${email}\n` +
            `ご希望のプラン: ${plan}\n` +
            `お問い合わせ内容:\n${message}`
        );
        
        window.location.href = `mailto:kazukuucyou@gmail.com?subject=${subject}&body=${body}`;
        
        setTimeout(() => {
            alert('メールアプリが起動します。\n内容をご確認の上、送信してください。');
            modal.remove();
        }, 500);
    });
    
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        modal.remove();
    });
}

// ページロード時にアニメーションを追加
window.addEventListener('load', () => {
    // ヒーローセクションのアニメーション
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        heroContent.style.opacity = '0';
        heroContent.style.transform = 'translateY(30px)';
        setTimeout(() => {
            heroContent.style.transition = 'all 0.8s ease';
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
        }, 100);
    }
});

console.log('KACP ランディングページが読み込まれました');
