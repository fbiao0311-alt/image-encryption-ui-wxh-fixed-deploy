import os
import math
import time
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "outputs"
RESULTS_DIR = OUTPUT_DIR / "results"
IMAGES_DIR = OUTPUT_DIR / "images"
ACF_IMAGES_DIR = OUTPUT_DIR / "acf_images"
ACF_DATA_DIR = OUTPUT_DIR / "acf_data"

OUTPUT_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)
ACF_IMAGES_DIR.mkdir(exist_ok=True)
ACF_DATA_DIR.mkdir(exist_ok=True)


def clean_bitstream(raw_text: str) -> str:
    return ''.join(c for c in raw_text if c in '01')


def analyze_randomness_from_text(raw_text: str):
    bits = clean_bitstream(raw_text)
    total_bits = len(bits)

    if total_bits == 0:
        return {
            "success": False,
            "message": "没有检测到有效的 0/1 比特流",
            "data": None
        }

    count_1 = bits.count('1')
    count_0 = total_bits - count_1

    p_1 = count_1 / total_bits
    p_0 = count_0 / total_bits

    entropy = 0
    if p_1 > 0:
        entropy -= p_1 * math.log2(p_1)
    if p_0 > 0:
        entropy -= p_0 * math.log2(p_0)

    return {
        "success": True,
        "message": "检测完成",
        "data": {
            "entropy": round(entropy, 6),
            "total_bits": total_bits,
            "count_0": count_0,
            "count_1": count_1,
            "p_0": round(p_0, 6),
            "p_1": round(p_1, 6),
            "ratio_text": f"{p_0 * 100:.2f}% / {p_1 * 100:.2f}%"
        }
    }


def calculate_bitstream_entropy(bitstream_file, n=10000000):
    if not Path(bitstream_file).exists():
        print(f"Error: File {bitstream_file} does not exist")
        return None

    try:
        with open(bitstream_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read().strip()
            bits = ''.join(c for c in content if c in '01')

            if len(bits) < n:
                print(f"Warning: File {bitstream_file} has fewer than {n} bits")
                bits = bits[:len(bits)]
            else:
                bits = bits[:n]

            count_1 = bits.count('1')
            count_0 = len(bits) - count_1

            p_1 = count_1 / len(bits) if len(bits) > 0 else 0
            p_0 = count_0 / len(bits) if len(bits) > 0 else 0

            entropy = 0
            if p_1 > 0:
                entropy -= p_1 * math.log2(p_1)
            if p_0 > 0:
                entropy -= p_0 * math.log2(p_0)

            return {
                'file_name': os.path.basename(bitstream_file),
                'entropy': entropy,
                'p_1': p_1,
                'p_0': p_0,
                'count_1': count_1,
                'count_0': count_0,
                'total_bits': len(bits)
            }
    except Exception as e:
        print(f"Error processing file {bitstream_file}: {e}")
        return None


def save_single_entropy_result(result, output_path, n):
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("Bitstream Shannon Entropy Analysis Results (with Detailed Calculation Process)\n")
        f.write("=" * 60 + "\n\n")

        f.write("[Calculation Principle]\n")
        f.write("Information entropy formula: H = -Σ p(i) * log₂(p(i))\n")
        f.write("Where p(i) is the probability of value i in the bitstream, i is 0 or 1\n")
        f.write("p(1) = Number of 1s / Total bitstream length\n")
        f.write("p(0) = Number of 0s / Total bitstream length\n\n")

        f.write("[File Analysis Results]\n")
        f.write("=" * 60 + "\n\n")

        f.write(f"File name: {result['file_name']}\n")
        f.write(f"File path: {result['file_name']}\n")
        f.write(f"Processed bits: {result['total_bits']}\n")
        f.write(f"Number of 1s: {result['count_1']}\n")
        f.write(f"Number of 0s: {result['count_0']}\n")
        f.write(f"Probability of 1 p(1) = {result['count_1']}/{result['total_bits']} = {result['p_1']:.6f}\n")
        f.write(f"Probability of 0 p(0) = {result['count_0']}/{result['total_bits']} = {result['p_0']:.6f}\n")
        f.write(f"Shannon entropy H = -[p(1)*log2(p(1)) + p(0)*log2(p(0))]\n")

        if result['p_1'] > 0:
            term1 = -result['p_1'] * math.log2(result['p_1'])
            f.write(f"  = -[{result['p_1']:.6f}*log2({result['p_1']:.6f}) + ")
        else:
            term1 = 0
            f.write("  = -[0 + ")

        if result['p_0'] > 0:
            term2 = -result['p_0'] * math.log2(result['p_0'])
            f.write(f"{result['p_0']:.6f}*log2({result['p_0']:.6f})]\n")
        else:
            term2 = 0
            f.write("0]\n")

        f.write(f"  = -[{term1:.6f} + {term2:.6f}]\n")
        f.write(f"  = {result['entropy']:.6f} bits\n\n")

        f.write("[Overall Statistics]\n")
        f.write("Total files processed: 1\n")
        f.write(f"Bits per file: {n}\n")
        f.write(f"Shannon entropy: {result['entropy']:.6f} bits\n")
        f.write(f"Probability of 1: {result['p_1']:.6f}\n")
        f.write("Theoretical maximum entropy: 1.0 bits (when p(0)=p(1)=0.5)\n")

    print(f"Entropy analysis results saved to: {output_path}")


def generate_bitstream_visualization(bitstream_file, output_image_path, n=10000, rows=100, cols=100):
    if not Path(bitstream_file).exists():
        print(f"Error: File {bitstream_file} does not exist")
        return None

    try:
        with open(bitstream_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read().strip()
            bits = ''.join(c for c in content if c in '01')

            if len(bits) < n:
                print(f"Warning: File {bitstream_file} has fewer than {n} bits")
                bits = bits[:len(bits)]
            else:
                bits = bits[:n]

            count_1 = bits.count('1')
            count_0 = len(bits) - count_1
            p_1 = count_1 / len(bits) if len(bits) > 0 else 0

            entropy = 0
            if p_1 > 0:
                entropy -= p_1 * math.log2(p_1)
            p_0 = 1 - p_1
            if p_0 > 0:
                entropy -= p_0 * math.log2(p_0)

            grid_data = np.zeros((rows, cols))

            for i in range(min(n, len(bits))):
                row = i // cols
                col = i % cols
                grid_data[row, col] = int(bits[i])

            output_dir = os.path.dirname(output_image_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)

            plt.figure(figsize=(10, 8), dpi=300)
            ax = plt.gca()
            ax.imshow(grid_data, cmap='binary', aspect='equal', interpolation='nearest')
            ax.invert_yaxis()

            plt.title(
                f'Shannon entropy = {entropy:.6f}  P={p_1 * 100:.2f}%',
                fontsize=18,
                pad=20
            )

            xticks = np.arange(0, cols + 1, 200)
            yticks = np.arange(rows, -1, -200)
            plt.xticks(xticks, fontsize=10)
            plt.yticks(yticks, fontsize=10)

            plt.grid(alpha=0.3, color='gray', linestyle='-', linewidth=0.5)

            plt.tight_layout()
            plt.savefig(output_image_path, dpi=300, bbox_inches='tight')
            plt.close()

            print(f"Bitstream visualization heatmap saved to: {output_image_path}")
            return {
                'file_name': os.path.basename(bitstream_file),
                'entropy': entropy,
                'p_1': p_1,
                'count_1': count_1,
                'count_0': count_0,
                'total_bits': len(bits)
            }
    except Exception as e:
        print(f"Error generating bitstream visualization: {e}")
        return None


def calculate_acf(bit_data, max_lag):
    N = len(bit_data)
    mu = np.mean(bit_data)
    sigma = np.std(bit_data, ddof=1)

    lags = np.arange(0, max_lag + 1)
    acf_values = []

    for k in lags:
        sum_corr = np.sum((bit_data[:N - k] - mu) * (bit_data[k:] - mu))
        acf = sum_corr / ((N - k) * sigma ** 2)
        acf_values.append(acf)

    return lags, np.array(acf_values)


def generate_acf_analysis(bitstream_file, output_plot_path, output_excel_path, read_count=1000000, max_lag=10000):
    with open(bitstream_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    bit_stream_full = np.array([int(c) for c in content if c in '01'], dtype=np.int64)

    if read_count is not None:
        bit_stream = bit_stream_full[:read_count]
    else:
        bit_stream = bit_stream_full

    if len(bit_stream) < 2:
        return None

    actual_max_lag = min(max_lag, len(bit_stream) - 1)

    print(f"ACF data reading completed, bitstream length: {len(bit_stream):,}")
    lags, acf_vals = calculate_acf(bit_stream, actual_max_lag)
    print(f"ACF calculation completed, lag range: 0 ~ {actual_max_lag}")

    N = len(bit_stream)
    conf_95_theoretical = 1.96 / np.sqrt(N)
    conf_95_actual = 1.96 * np.std(acf_vals[1:])

    USE_ACTUAL_CI = True
    if USE_ACTUAL_CI:
        conf_95 = conf_95_actual
    else:
        conf_95 = conf_95_theoretical

    plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
    plt.rcParams['axes.unicode_minus'] = False
    plt.figure(figsize=(12, 6), dpi=300)

    plt.scatter(lags[1:], acf_vals[1:], s=1, color='black', alpha=0.8)

    plt.axhline(y=conf_95, color='gray', linestyle='--', linewidth=1, label=f'95% CI: ±{conf_95:.6f}')
    plt.axhline(y=-conf_95, color='gray', linestyle='--', linewidth=1)

    plt.axhline(y=0, color='red', linestyle='-', linewidth=0.8)

    plt.xlabel('Lag', fontsize=12, fontweight='bold')
    plt.ylabel('Normalized Autocorrelation Coefficient (ACF)', fontsize=12, fontweight='bold')
    plt.title('Random Bitstream Autocorrelation Function', fontsize=14, fontweight='bold', pad=20)
    plt.legend(loc='upper right', fontsize=10)
    plt.grid(alpha=0.2, axis='y')
    plt.xlim(0, actual_max_lag)

    y_min = min(np.min(acf_vals[1:]), -conf_95) * 1.2
    y_max = max(np.max(acf_vals[1:]), conf_95) * 1.2
    plt.ylim(y_min, y_max)

    plt.tight_layout()
    plt.savefig(output_plot_path, dpi=300, bbox_inches='tight')
    plt.close()

    df = pd.DataFrame({'Lag': lags[1:], 'ACF': acf_vals[1:]})
    df.to_excel(output_excel_path, index=False, engine='openpyxl')

    print(f"ACF data saved to: {output_excel_path}")
    print(f"ACF plot saved to: {output_plot_path}")

    return {
        "bits_used": len(bit_stream),
        "max_lag": actual_max_lag,
        "confidence_interval_95": float(conf_95),
        "lag_points": len(lags[1:]),
        "use_actual_ci": USE_ACTUAL_CI
    }


def analyze_uploaded_bitstream(bitstream_file_path: str):
    input_path = Path(bitstream_file_path)

    if not input_path.exists():
        return {
            "success": False,
            "message": "上传的文件不存在",
            "data": None
        }

    with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read().strip()
        bits = ''.join(c for c in content if c in '01')

    total_bits_available = len(bits)

    if total_bits_available == 0:
        return {
            "success": False,
            "message": "文件中没有有效的 0/1 比特流",
            "data": None
        }

    side_length = int(math.sqrt(total_bits_available))
    rows = side_length
    cols = side_length
    n = rows * cols

    timestamp = int(time.time() * 1000)
    base_name = input_path.stem

    output_result_path = RESULTS_DIR / f"{base_name}_{timestamp}_shannon_entropy.txt"
    output_image_path = IMAGES_DIR / f"{base_name}_{timestamp}_heatmap.png"
    output_acf_plot_path = ACF_IMAGES_DIR / f"{base_name}_{timestamp}_acf_plot.png"
    output_acf_excel_path = ACF_DATA_DIR / f"{base_name}_{timestamp}_acf_data.xlsx"

    result = calculate_bitstream_entropy(str(input_path), n)
    if not result:
        return {
            "success": False,
            "message": "香农熵计算失败",
            "data": None
        }

    save_single_entropy_result(result, str(output_result_path), n)

    visualization_result = generate_bitstream_visualization(
        str(input_path),
        str(output_image_path),
        n,
        rows,
        cols
    )

    if not visualization_result:
        return {
            "success": False,
            "message": "热图生成失败",
            "data": None
        }

    acf_result = generate_acf_analysis(
        str(input_path),
        str(output_acf_plot_path),
        str(output_acf_excel_path),
        read_count=min(1000000, total_bits_available),
        max_lag=min(10000, max(1, min(1000000, total_bits_available) - 1))
    )

    if not acf_result:
        return {
            "success": False,
            "message": "ACF 分析失败",
            "data": None
        }

    return {
        "success": True,
        "message": "检测完成",
        "data": {
            "entropy": round(result["entropy"], 6),
            "total_bits": result["total_bits"],
            "count_0": result["count_0"],
            "count_1": result["count_1"],
            "p_0": round(result["p_0"], 6),
            "p_1": round(result["p_1"], 6),
            "ratio_text": f"{result['p_0'] * 100:.2f}% / {result['p_1'] * 100:.2f}%",
            "heatmap_url": f"/static/images/{output_image_path.name}",
            "report_url": f"/static/results/{output_result_path.name}",
            "heatmap_rows": rows,
            "heatmap_cols": cols,
            "heatmap_bits_used": n,
            "acf_plot_url": f"/static/acf_images/{output_acf_plot_path.name}",
            "acf_excel_url": f"/static/acf_data/{output_acf_excel_path.name}",
            "acf_bits_used": acf_result["bits_used"],
            "acf_max_lag": acf_result["max_lag"],
            "acf_confidence_interval": round(acf_result["confidence_interval_95"], 6),
            "acf_lag_points": acf_result["lag_points"]
        }
    }
