# Dancing☆Onigiri Chart Reverser
[![Maintainability](https://api.codeclimate.com/v1/badges/cd9f754272b986befd7d/maintainability)](https://codeclimate.com/github/cwtickle/danoniplus-reverser/maintainability)
[![Join the chat at https://gitter.im/danonicw/community](https://badges.gitter.im/danonicw/community.svg)](https://gitter.im/danonicw/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)  
Dancing☆Onigiriの譜面データを、各種エディターデータへ逆変換するツールです。  
(従来の ScoreRevival に相当するツール)

## How to Use
1.  [このページにアクセス](https://cwtickle.github.io/danoniplus-reverser/)します。
2.  譜面データをテキストボックスにペーストします。
3.  ファーストナンバー, BPM, テンポ変化ページ(テンポ変化毎にカンマ区切りで指定)を入力します。  
※ファーストナンバーは譜面データより自動取得することもできます。  
　テンポ変化ページは通常エディターの復元データからも取得可能です。
4.  変換先のエディターを選択します。
5. 「Convert」を押すと、対応するエディターのセーブデータが出力されます。  
「Copy」を押してデータをファイルへ保存し、実際のエディターで読み込むと譜面が復元されます。

### セーブファイルの変換に関する留意点
- 3連符の切り替えには対応していません。
- BPMやInterval, テンポ変化情報が正しくない場合、近似したコマに展開されます。  
この場合、エディターの展開はできますがコマの位置が想定と異なることがあります。  
- 現状、譜面ヘッダー及びフッターには未対応です。
